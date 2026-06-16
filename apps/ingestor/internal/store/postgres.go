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

// LookupSiteID resolves a bare domain to its numeric site id. The bool is false
// when the domain is not registered. (Schema is owned by @seyr/db migrations.)
func LookupSiteID(ctx context.Context, pool *pgxpool.Pool, domain string) (uint64, bool, error) {
	var id int64
	err := pool.QueryRow(ctx, "SELECT id FROM sites WHERE domain = $1 LIMIT 1", domain).Scan(&id)
	if errors.Is(err, pgx.ErrNoRows) {
		return 0, false, nil
	}
	if err != nil {
		return 0, false, err
	}
	return uint64(id), true, nil
}
