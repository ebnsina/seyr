// Package buffer batches event rows in memory and flushes them to ClickHouse by
// size or interval — ClickHouse strongly prefers few large inserts to many small
// ones. A single goroutine owns the batch, so no locking is needed on the slice.
package buffer

import (
	"context"
	"log"
	"sync/atomic"
	"time"

	"github.com/ClickHouse/clickhouse-go/v2/lib/driver"

	"github.com/seyr/ingestor/internal/event"
	"github.com/seyr/ingestor/internal/store"
)

// Buffer accepts rows on the hot path and flushes them asynchronously.
type Buffer struct {
	conn          driver.Conn
	flushSize     int
	flushInterval time.Duration

	in      chan event.Row
	done    chan struct{}
	dropped atomic.Uint64
}

// New creates a Buffer. The input channel is sized generously so brief insert
// stalls don't immediately shed traffic.
func New(conn driver.Conn, flushSize int, flushInterval time.Duration) *Buffer {
	return &Buffer{
		conn:          conn,
		flushSize:     flushSize,
		flushInterval: flushInterval,
		in:            make(chan event.Row, flushSize*4),
		done:          make(chan struct{}),
	}
}

// Add enqueues a row without blocking. If the queue is saturated the row is
// dropped and counted, so a slow ClickHouse never stalls request latency.
func (b *Buffer) Add(row event.Row) {
	select {
	case b.in <- row:
	default:
		b.dropped.Add(1)
	}
}

// Dropped returns the number of rows shed due to a saturated queue.
func (b *Buffer) Dropped() uint64 { return b.dropped.Load() }

// Run owns the batch until ctx is cancelled, then drains and signals via Done.
func (b *Buffer) Run(ctx context.Context) {
	defer close(b.done)
	ticker := time.NewTicker(b.flushInterval)
	defer ticker.Stop()

	batch := make([]event.Row, 0, b.flushSize)
	flush := func() {
		if len(batch) == 0 {
			return
		}
		// Use a detached context so an in-flight flush isn't cut short by shutdown.
		fctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
		defer cancel()
		if err := store.InsertEvents(fctx, b.conn, batch); err != nil {
			log.Printf("[buffer] flush failed (%d rows): %v", len(batch), err)
		}
		batch = batch[:0]
	}

	for {
		select {
		case row := <-b.in:
			batch = append(batch, row)
			if len(batch) >= b.flushSize {
				flush()
			}
		case <-ticker.C:
			flush()
		case <-ctx.Done():
			// Drain anything already queued, then final flush.
			for {
				select {
				case row := <-b.in:
					batch = append(batch, row)
				default:
					flush()
					return
				}
			}
		}
	}
}

// Done is closed once Run has fully drained after context cancellation.
func (b *Buffer) Done() <-chan struct{} { return b.done }

// Len reports the approximate number of rows waiting in the queue.
func (b *Buffer) Len() int { return len(b.in) }
