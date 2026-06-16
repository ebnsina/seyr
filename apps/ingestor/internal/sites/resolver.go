// Package sites resolves reported domains to site/org/limit info, with caching so
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
	info    store.SiteInfo
	found   bool // negative cache: domain is known-unregistered
	expires time.Time
}

// Resolver caches domain → site info (including negatives) with a TTL.
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

// Resolve returns the site info for a domain, and false if it isn't registered.
func (r *Resolver) Resolve(ctx context.Context, domain string) (store.SiteInfo, bool, error) {
	now := time.Now()

	r.mu.RLock()
	if e, ok := r.cache[domain]; ok && e.expires.After(now) {
		r.mu.RUnlock()
		return e.info, e.found, nil
	}
	r.mu.RUnlock()

	info, found, err := store.LookupSite(ctx, r.pool, domain)
	if err != nil {
		return store.SiteInfo{}, false, err
	}

	r.mu.Lock()
	r.cache[domain] = entry{info: info, found: found, expires: now.Add(r.ttl)}
	r.mu.Unlock()

	return info, found, nil
}
