package store

import (
	"context"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// NewPostgres opens a connection pool to Postgres.
func NewPostgres(ctx context.Context, url string) (*pgxpool.Pool, error) {
	pool, err := pgxpool.New(ctx, url)
	if err != nil {
		return nil, fmt.Errorf("postgres connect: %w", err)
	}
	return pool, nil
}

// SiteInfo is what the ingestor needs about a registered site: its numeric id,
// owning org, and that org's monthly event limit (default free tier if unset).
type SiteInfo struct {
	SiteID       uint64
	OrgID        string
	MonthlyLimit int64
}

// LookupSite resolves a bare domain to its site + org + monthly limit. The bool
// is false when the domain is not registered. (Schema owned by @seyr/db.)
func LookupSite(ctx context.Context, pool *pgxpool.Pool, domain string) (SiteInfo, bool, error) {
	var info SiteInfo
	var id int64
	err := pool.QueryRow(ctx, `
		SELECT s.id, s.org_id, COALESCE(sub.monthly_event_limit, 10000)
		FROM sites s
		LEFT JOIN subscriptions sub ON sub.org_id = s.org_id
		WHERE s.domain = $1 LIMIT 1`, domain).Scan(&id, &info.OrgID, &info.MonthlyLimit)
	if errors.Is(err, pgx.ErrNoRows) {
		return SiteInfo{}, false, nil
	}
	if err != nil {
		return SiteInfo{}, false, err
	}
	info.SiteID = uint64(id)
	return info, true, nil
}

// GetUsage reads the stored event count for an org in a period ("YYYY-MM-01").
func GetUsage(ctx context.Context, pool *pgxpool.Pool, orgID, period string) (int64, error) {
	var events int64
	err := pool.QueryRow(ctx,
		"SELECT events FROM usage WHERE org_id = $1 AND period = $2", orgID, period).Scan(&events)
	if errors.Is(err, pgx.ErrNoRows) {
		return 0, nil
	}
	return events, err
}

// AddUsage atomically adds a delta to an org's monthly counter (upsert).
func AddUsage(ctx context.Context, pool *pgxpool.Pool, orgID, period string, delta int64) error {
	_, err := pool.Exec(ctx, `
		INSERT INTO usage (org_id, period, events, created_at, updated_at)
		VALUES ($1, $2, $3, now(), now())
		ON CONFLICT (org_id, period)
		DO UPDATE SET events = usage.events + EXCLUDED.events, updated_at = now()`,
		orgID, period, delta)
	return err
}
