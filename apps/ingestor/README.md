# ingestor (Go)

The high-throughput beacon ingestion service. Receives tracker beacons, derives
geo/device/visitor data, and batch-writes events to ClickHouse.

Written in Go for predictable low-latency throughput and a small static-binary
deploy. The wire contract (beacon payload) and the ClickHouse/Postgres schemas
are shared with the rest of the stack — those tables are owned by `@seyr/db`
migrations and `infra/clickhouse`, not this service.

```bash
go run ./cmd/ingestor        # run (reads env; see repo .env)
go build -o bin/ingestor ./cmd/ingestor
go test ./...                # unit tests
go vet ./...
```

Requires the env from the repo `.env` (notably `DATABASE_URL`,
`CLICKHOUSE_ADDR` = native port `:9000`, `INGEST_SALT_SECRET`).

## Request flow (`POST /i`)

1. **Bot filter** — reject crawlers/automation (and empty UAs) before any work.
2. **Validate** — decode + bounds-check the beacon (mirrors the zod schema).
3. **Resolve site** — domain → numeric `site_id` (TTL cache + negative cache).
4. **Derive & hash** — IP + UA produce geo, device, and a daily-rotating visitor
   hash, then are discarded. **No PII is ever stored.**
5. **Buffer** — the row is queued and the response is `202` immediately. A single
   goroutine batches rows and flushes to ClickHouse by size or interval, and
   drains on `SIGINT`/`SIGTERM`.

The route path (`/i`) is intentionally neutral to avoid ad-blocker rules.

## Layout

```
cmd/ingestor/        entry point + graceful shutdown
internal/config/     env-driven configuration
internal/event/      beacon/row types, validation, url/ua/geo/bot/hash/salt, pipeline
internal/store/      ClickHouse batch writer + Postgres site lookup
internal/sites/      cached domain → site_id resolver
internal/buffer/     in-memory batch buffer (size/interval flush)
internal/server/     HTTP handlers (health, ingest, CORS preflight)
```

## MVP simplifications

- Sessions: one per visitor per day (true 30-min inactivity windows are later).
- Geo: country from CDN headers; region/city via MaxMind is a drop-in addition.
- Bot filter: pragmatic regex; higher-fidelity detection is a polish-phase item.
- Saturated-queue rows are dropped and counted (`/health` `dropped`) to protect
  request latency.
