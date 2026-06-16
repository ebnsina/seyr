# @seyr/ingestor

The high-throughput beacon ingestion service (Bun + Hono). Receives tracker
beacons, derives geo/device/visitor data, and batch-writes events to ClickHouse.

```bash
pnpm --filter @seyr/ingestor dev     # watch mode
pnpm --filter @seyr/ingestor start   # run once
pnpm --filter @seyr/ingestor test    # bun test
```

## Request flow (`POST /i`)

1. **Bot filter** — reject crawlers (`isbot`) before any work.
2. **Validate** — parse the beacon body with the shared zod schema.
3. **Resolve site** — domain → numeric `site_id` (cached, with a negative cache
   for unregistered domains).
4. **Derive & hash** — IP + UA produce geo, device, and a daily-rotating visitor
   hash, then are discarded. **No PII is ever stored.**
5. **Buffer** — the row is queued; the response is `202` immediately. A background
   buffer flushes to ClickHouse by size or interval and drains on shutdown.

The route path (`/i`) and other knobs come from `@seyr/shared` / env — see
`src/config.ts`. The path is intentionally neutral to avoid ad-blocker rules.

## Notes / MVP simplifications

- Sessions: one per visitor per day (true 30-min inactivity windows are a later
  refinement).
- Geo: country from CDN headers (`cf-ipcountry`, etc.); region/city via MaxMind is
  a drop-in addition.
- Plan-limit enforcement hooks land with the billing phase.
