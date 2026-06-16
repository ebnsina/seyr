// Package usage maintains authoritative per-org monthly event counters. It keeps
// an in-memory running total (seeded from Postgres) for fast limit checks, and
// periodically flushes deltas back to the `usage` table so billing/dashboard
// have a source of truth without scanning ClickHouse.
package usage

import (
	"context"
	"log"
	"sync"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/seyr/ingestor/internal/store"
)

// Period returns the current monthly bucket key ("YYYY-MM-01", UTC).
func Period(now time.Time) string {
	return now.UTC().Format("2006-01") + "-01"
}

type counter struct {
	period string
	count  int64 // absolute month-to-date total
	delta  int64 // unflushed increments
}

// Tracker counts events per org and flushes deltas to Postgres on an interval.
type Tracker struct {
	pool          *pgxpool.Pool
	flushInterval time.Duration

	mu       sync.Mutex
	counters map[string]*counter
	timer    *time.Ticker
	done     chan struct{}
}

func NewTracker(pool *pgxpool.Pool, flushInterval time.Duration) *Tracker {
	return &Tracker{
		pool:          pool,
		flushInterval: flushInterval,
		counters:      make(map[string]*counter),
		done:          make(chan struct{}),
	}
}

// Record increments an org's counter for the current period and returns the new
// month-to-date total. The first time an org/period is seen, the running total
// is seeded from Postgres so restarts don't lose accumulated usage.
func (t *Tracker) Record(ctx context.Context, orgID string, now time.Time) int64 {
	period := Period(now)

	t.mu.Lock()
	c, ok := t.counters[orgID]
	if !ok || c.period != period {
		// Seed absolute total from PG (best-effort) on first sight / new month.
		t.mu.Unlock()
		seed, err := store.GetUsage(ctx, t.pool, orgID, period)
		if err != nil {
			log.Printf("[usage] seed failed for %s: %v", orgID, err)
		}
		t.mu.Lock()
		c = &counter{period: period, count: seed}
		t.counters[orgID] = c
	}
	c.count++
	c.delta++
	total := c.count
	t.mu.Unlock()
	return total
}

// Start begins the periodic flush loop.
func (t *Tracker) Start(ctx context.Context) {
	t.timer = time.NewTicker(t.flushInterval)
	go func() {
		defer close(t.done)
		for {
			select {
			case <-t.timer.C:
				t.flush(ctx)
			case <-ctx.Done():
				t.flush(context.Background())
				return
			}
		}
	}()
}

// Stop halts the loop and performs a final flush.
func (t *Tracker) Stop() {
	if t.timer != nil {
		t.timer.Stop()
	}
	<-t.done
}

func (t *Tracker) flush(ctx context.Context) {
	type pending struct {
		orgID, period string
		delta         int64
	}
	var batch []pending

	t.mu.Lock()
	for orgID, c := range t.counters {
		if c.delta > 0 {
			batch = append(batch, pending{orgID, c.period, c.delta})
			c.delta = 0
		}
	}
	t.mu.Unlock()

	for _, p := range batch {
		if err := store.AddUsage(ctx, t.pool, p.orgID, p.period, p.delta); err != nil {
			log.Printf("[usage] flush failed for %s: %v", p.orgID, err)
			// Re-credit the delta so it's retried next tick.
			t.mu.Lock()
			if c, ok := t.counters[p.orgID]; ok && c.period == p.period {
				c.delta += p.delta
			}
			t.mu.Unlock()
		}
	}
}
