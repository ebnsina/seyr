// Package store holds the ClickHouse and Postgres data-access used by the ingestor.
package store

import (
	"context"
	"fmt"

	"github.com/ClickHouse/clickhouse-go/v2"
	"github.com/ClickHouse/clickhouse-go/v2/lib/driver"

	"github.com/seyr/ingestor/internal/config"
	"github.com/seyr/ingestor/internal/event"
)

// insertColumns is the explicit column list for the events batch insert. Columns
// omitted here (is_bounce, duration) fall back to their ClickHouse DEFAULTs.
const insertColumns = `site_id, timestamp, name, visitor_id, session_id,
	hostname, pathname, referrer, referrer_source,
	utm_source, utm_medium, utm_campaign,
	country_code, region, city,
	browser, browser_version, os, os_version, device,
	prop_keys, prop_values`

// NewClickHouse opens a connection to ClickHouse using the native protocol with
// async inserts enabled (server-side batching complements our in-memory buffer).
func NewClickHouse(cfg *config.Config) (driver.Conn, error) {
	conn, err := clickhouse.Open(&clickhouse.Options{
		Addr: []string{cfg.ClickHouseAddr},
		Auth: clickhouse.Auth{
			Database: cfg.ClickHouseDB,
			Username: cfg.ClickHouseUser,
			Password: cfg.ClickHousePass,
		},
		Settings: clickhouse.Settings{
			"async_insert":          1,
			"wait_for_async_insert": 0,
		},
	})
	if err != nil {
		return nil, fmt.Errorf("clickhouse open: %w", err)
	}
	return conn, nil
}

// InsertEvents writes a batch of rows. Callers should batch — never one per call.
func InsertEvents(ctx context.Context, conn driver.Conn, rows []event.Row) error {
	if len(rows) == 0 {
		return nil
	}
	batch, err := conn.PrepareBatch(ctx, "INSERT INTO events ("+insertColumns+")")
	if err != nil {
		return fmt.Errorf("prepare batch: %w", err)
	}
	for i := range rows {
		r := &rows[i]
		if err := batch.Append(
			r.SiteID, r.Timestamp, r.Name, r.VisitorID, r.SessionID,
			r.Hostname, r.Pathname, r.Referrer, r.ReferrerSource,
			r.UTMSource, r.UTMMedium, r.UTMCampaign,
			r.CountryCode, r.Region, r.City,
			r.Browser, r.BrowserVersion, r.OS, r.OSVersion, r.Device,
			r.PropKeys, r.PropValues,
		); err != nil {
			return fmt.Errorf("append row: %w", err)
		}
	}
	return batch.Send()
}
