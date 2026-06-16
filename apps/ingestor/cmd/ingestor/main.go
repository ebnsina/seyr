// Command ingestor is the high-throughput beacon ingestion service.
//
// Request flow (POST /i): bot-filter → validate → resolve site → derive
// geo/device/visitor-hash (discarding IP & UA) → buffer → 202. A background
// buffer batch-writes rows to ClickHouse and drains on shutdown.
package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/seyr/ingestor/internal/buffer"
	"github.com/seyr/ingestor/internal/config"
	"github.com/seyr/ingestor/internal/event"
	"github.com/seyr/ingestor/internal/server"
	"github.com/seyr/ingestor/internal/sites"
	"github.com/seyr/ingestor/internal/store"
	"github.com/seyr/ingestor/internal/usage"
)

func main() {
	if err := run(); err != nil {
		log.Fatalf("[ingestor] fatal: %v", err)
	}
}

func run() error {
	cfg, err := config.Load()
	if err != nil {
		return err
	}

	ctx := context.Background()

	pool, err := store.NewPostgres(ctx, cfg.DatabaseURL)
	if err != nil {
		return err
	}
	defer pool.Close()

	conn, err := store.NewClickHouse(cfg)
	if err != nil {
		return err
	}
	defer conn.Close()

	buf := buffer.New(conn, cfg.FlushSize, cfg.FlushInterval)
	bufCtx, stopBuf := context.WithCancel(ctx)
	defer stopBuf() // safety net; the drain path below also calls it explicitly
	go buf.Run(bufCtx)

	tracker := usage.NewTracker(pool, cfg.UsageFlushInterval)
	tracker.Start(bufCtx)

	srv := server.New(
		buf,
		sites.NewResolver(pool, cfg.SiteCacheTTL),
		event.NewSaltManager(cfg.SaltSecret),
		tracker,
		cfg.OverLimitMode == "block",
	)
	httpServer := &http.Server{
		Addr:              fmt.Sprintf(":%d", cfg.Port),
		Handler:           srv.Handler(),
		ReadHeaderTimeout: 5 * time.Second,
	}

	// Run the HTTP server until a signal arrives.
	errCh := make(chan error, 1)
	go func() {
		log.Printf("[ingestor] listening on http://localhost:%d", cfg.Port)
		if err := httpServer.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			errCh <- err
		}
	}()

	sigCh := make(chan os.Signal, 1)
	signal.Notify(sigCh, syscall.SIGINT, syscall.SIGTERM)

	select {
	case err := <-errCh:
		return err
	case <-sigCh:
		log.Println("[ingestor] shutting down, draining buffer…")
	}

	// Stop accepting new requests, then drain the buffer.
	shutdownCtx, cancel := context.WithTimeout(ctx, cfg.ShutdownTimeout)
	defer cancel()
	_ = httpServer.Shutdown(shutdownCtx)

	stopBuf()
	tracker.Stop() // final usage flush
	select {
	case <-buf.Done():
		log.Println("[ingestor] buffer drained, bye")
	case <-shutdownCtx.Done():
		log.Println("[ingestor] shutdown timeout; some events may be unflushed")
	}
	return nil
}
