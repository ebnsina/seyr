// Package sites resolves reported domains to numeric site ids, with caching so
// the hot path doesn't hit Postgres on every beacon.
package sites

import (
	"context"
	"sync"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/seyr/ingestor/internal/store"
)

type entry struct {
	siteID  uint64
	found   bool // negative cache: domain is known-unregistered
	expires time.Time
}

// Resolver caches domain → site id lookups (including negatives) with a TTL.
type Resolver struct {
	pool *pgxpool.Pool
	ttl  time.Duration

	mu    sync.RWMutex
	cache map[string]entry
}

// NewResolver builds a Resolver over the given pool.
func NewResolver(pool *pgxpool.Pool, ttl time.Duration) *Resolver {
	return &Resolver{pool: pool, ttl: ttl, cache: make(map[string]entry)}
}

// Resolve returns the site id for a domain, and false if it isn't registered.
func (r *Resolver) Resolve(ctx context.Context, domain string) (uint64, bool, error) {
	now := time.Now()

	r.mu.RLock()
	if e, ok := r.cache[domain]; ok && e.expires.After(now) {
		r.mu.RUnlock()
		return e.siteID, e.found, nil
	}
	r.mu.RUnlock()

	siteID, found, err := store.LookupSiteID(ctx, r.pool, domain)
	if err != nil {
		return 0, false, err
	}

	r.mu.Lock()
	r.cache[domain] = entry{siteID: siteID, found: found, expires: now.Add(r.ttl)}
	r.mu.Unlock()

	return siteID, found, nil
}
