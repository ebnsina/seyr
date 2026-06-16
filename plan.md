# Plan: Privacy-First Web Analytics SaaS ("seyr")

## Context

GA4 is cluttered, slow, consent-heavy, and overkill for most site owners. The goal is a
**Plausible/Fathom-style alternative**: a single clean dashboard with the numbers that
matter (visitors, pageviews, top pages, sources, devices, countries), a tiny embeddable
script, and a **cookieless, no-PII** design that needs no cookie banner. This is a
greenfield build (`/Users/ebnsina/Sites/seyr` is empty) targeting a real SaaS from day
one — multi-tenant orgs, Stripe billing, and plan limits.

### Decisions locked with the user
- **Stack:** SvelteKit dashboard **+ a separate lightweight ingestion service** (Bun + Hono).
- **Event store:** ClickHouse (columnar OLAP — same choice as Plausible).
- **App/relational DB:** Postgres (users, orgs, sites, billing).
- **Scope:** Core analytics MVP **+ billing/SaaS** (orgs, Stripe, plan limits).
- **Privacy:** Cookieless, no PII. Daily-rotating salt for visitor hashing; no cross-day
  user tracking; no persistent identifiers.
- **Tracker:** Custom hand-rolled lightweight (<1KB) vanilla JS script.

---

## Architecture overview

```
                          ┌─────────────────────────┐
  Customer's website      │  tracker.js  (<1KB)     │
  <script ... seyr.js>───▶│  sends pageview beacon  │
                          └───────────┬─────────────┘
                                      │ POST /event (tiny JSON)
                                      ▼
                          ┌─────────────────────────┐        ┌──────────────┐
                          │  INGESTOR (Bun + Hono)  │───────▶│  ClickHouse  │
                          │  validate → hash → buffer│ batch  │   events     │
                          │  → batch insert          │ insert └──────────────┘
                          └─────────────────────────┘                ▲
                                                                      │ read queries
                          ┌─────────────────────────┐                │
  Site owner ───▶ browser │  DASHBOARD (SvelteKit)  │────────────────┘
                          │  auth, sites, charts,    │        ┌──────────────┐
                          │  settings, Stripe billing│───────▶│  Postgres    │
                          └─────────────────────────┘        │ users/orgs/… │
                                                              └──────────────┘
```

**Why two services:** ingestion is high-volume, tiny-payload, latency-sensitive, and
must stay cheap/edge-friendly. The dashboard is standard authed CRUD/SSR. Splitting them
lets each scale and deploy independently and keeps a flaky dashboard deploy from dropping
events.

### Monorepo layout (pnpm workspaces + Turborepo)
```
seyr/
  apps/
    dashboard/      # SvelteKit — UI, auth, billing, read API
    ingestor/       # Bun + Hono — /event ingestion + batch writer to ClickHouse
  packages/
    tracker/        # source for the embeddable script (built to dist/seyr.js)
    db/             # Drizzle schema + migrations (Postgres) + ClickHouse client/schema
    shared/         # zod schemas, UA/referrer parsing, geo lookup, types
  infra/
    docker-compose.yml   # local Postgres + ClickHouse
    clickhouse/          # ClickHouse DDL / migrations
```

---

## Data model

### ClickHouse — `events` (the hot path)
One wide, denormalized table optimized for time-range + group-by reads. Representative
columns:

| column | type | notes |
|---|---|---|
| `site_id` | `UInt64` / `String` | tenant/site key (drives partitioning) |
| `timestamp` | `DateTime` | event time (UTC) |
| `name` | `LowCardinality(String)` | `pageview` or custom event name |
| `visitor_id` | `UInt64` | daily-rotating hash (salt+ip+ua+domain) — NOT durable PII |
| `session_id` | `UInt64` | derived; for bounce/duration |
| `pathname` / `hostname` | `String` / `LowCardinality` | page |
| `referrer_source` / `referrer` | `LowCardinality` / `String` | parsed source (google, twitter…) |
| `utm_source/medium/campaign` | `LowCardinality(String)` | campaign attribution |
| `country_code` / `region` / `city` | `LowCardinality` | from IP geo, IP then discarded |
| `browser` / `os` / `device` | `LowCardinality(String)` | parsed from UA, UA discarded |
| `screen_size` | `LowCardinality(String)` | bucketed (mobile/tablet/desktop) |
| `entry_page` / `exit_page` | `String` | session-level |

- Engine: `MergeTree` (consider `ReplacingMergeTree` later for dedupe).
- `PARTITION BY toYYYYMM(timestamp)`, `ORDER BY (site_id, timestamp)`.
- TTL by plan retention (e.g. drop raw rows after N months on lower tiers).
- Pre-aggregated rollup tables (Materialized Views) for common queries (daily uniques per
  site/page) added **after** the raw pipeline works — do not build these up front.

### Postgres — relational (via Drizzle)
- `users` — auth identity.
- `organizations` — tenant boundary; owns billing.
- `memberships` — user↔org with role (owner/admin/viewer).
- `sites` — domain, `site_id`, timezone, public/private flag, org_id.
- `subscriptions` — Stripe customer/subscription/price, plan, status.
- `usage` — monthly event counts per org for plan-limit enforcement.
- `shared_links` / `goals` — (phase 2) public dashboards & conversion goals.

---

## Privacy design (the selling point)

- **No cookies, no localStorage** in the tracker. No persistent ID ever leaves the browser.
- **`visitor_id` = hash(daily_salt + ip + user_agent + domain)**. The salt rotates every
  24h and old salts are discarded, so a visitor cannot be tracked across days — matches
  Plausible's approach.
- **IP and raw UA are never stored** — used transiently in the ingestor to compute geo +
  device, then dropped before insert.
- No cross-site tracking, no fingerprinting, no PII. This is what lets customers drop the
  cookie banner; make it explicit in marketing copy and a `/privacy` page.

---

## Component plan

### 0. Ad-blocker / extension evasion (first-class concern)
Ad blockers (uBlock Origin, AdGuard, Brave, EasyPrivacy lists) block requests by URL/word
**and** by known analytics domains. Words like `analytics`, `track`, `event`, `ingest`,
`collect`, `stat`, `pageview` in script names or paths get filtered, and any shared
SaaS ingestion domain gets added to blocklists quickly. Mitigations baked into the design:

- **Neutral, non-triggering naming** for public-facing assets: the script is `seyr.js`
  (or a customer-renamable file), and the ingestion route is a generic path — **avoid**
  `/event`, `/track`, `/collect`, `/api/analytics`. Use something innocuous and
  configurable (e.g. `/p` or `/h`); the route name lives in one config constant so it can
  change without touching the tracker logic. *(The architecture diagram's `/event` is
  illustrative — the real path will be the neutral one.)*
- **First-party proxy / custom domain (the real fix):** the most reliable bypass is
  serving the script and receiving beacons from the **customer's own domain**. Offer two
  install modes:
  1. *Default:* script + beacons go to our domain (works, but blockable over time).
  2. *Proxy mode:* docs + helpers for the customer to proxy the script and a path (e.g.
     `yoursite.com/seyr/...`) to us via their CDN/edge (Cloudflare Worker, Vercel rewrite,
     Nginx). First-party requests are not blocked. Provide copy-paste configs per platform.
- **Use our own domain, not a flagged one**, for the default endpoint, and keep the
  payload/path generic so signature-based rules have nothing obvious to match.
- **Expectation-setting:** document that no analytics is 100% unblockable; proxy mode gets
  the highest capture rate. Surface an estimated "blocked %" later if feasible.
- The ingestor must accept the beacon regardless of path prefix used by proxies (match on
  the configured route, not a hardcoded string).

### 1. `packages/tracker` — the embeddable script
- Vanilla TS compiled/minified to a single `seyr.js` (<1KB gzipped), served with long
  cache + versioning. Script name and endpoint path are **config-driven** (see §0) so they
  never hardcode blocker-triggering words.
- Sends a `pageview` on load and on SPA route change (`history.pushState`/`popstate`
  patch). Uses `navigator.sendBeacon` with `fetch` keepalive fallback.
- Payload kept minimal: `{ name, url, referrer, domain, screen }` — everything else
  (geo, device, hash) is derived server-side from headers the browser sends anyway.
- Respects `localhost`/DNT opt-out and a `data-exclude` option.
- Exposes `window.seyr('event', name, props)` for custom events (server enforces prop
  limits). Auto-events deferred (user chose lightweight-only for now).

### 2. `apps/ingestor` — Bun + Hono service
- Single hot route `POST /event` (+ `GET /health`).
- Pipeline: parse → zod-validate → bot filter (UA + known-bot list) → derive
  geo (MaxMind GeoLite2 or IP API) + device (UA parser) → compute `visitor_id` with
  current salt → enqueue.
- **Batched async writes**: buffer events in memory and flush to ClickHouse every ~1–2s
  or N rows (ClickHouse hates many small inserts). Graceful flush on shutdown.
- Returns `202` fast; never blocks the beacon on the DB write.
- Salt manager: in-memory daily salt, regenerated at UTC midnight (persist current+prev
  salt in Redis/Postgres so multiple instances agree).
- CORS open for `/event` (must accept hits from any customer domain).
- **Why Bun + Hono:** keeps the whole codebase TypeScript (shared zod schemas / parsing
  with the dashboard) while staying tiny and fast. *Alternative if throughput becomes the
  bottleneck: rewrite this one service in Go — the contract (payload + ClickHouse schema)
  stays identical, so it's a contained swap.*

### 3. `apps/dashboard` — SvelteKit
- **Auth:** Lucia (or Better Auth) with email/password + magic link; sessions in Postgres.
- **Onboarding:** create org → add site → show the copy-paste snippet + "verify
  installation" check (polls ClickHouse for the first event).
- **Dashboard view** (the core screen): date-range picker; top-line cards (unique
  visitors, total pageviews, bounce rate, visit duration); visitors-over-time chart; and
  breakdown panels — Top Pages, Sources/Referrers, Countries, Devices/Browsers/OS, UTM
  campaigns. Each panel filterable (clicking a row filters the whole dashboard).
- **Read API:** SvelteKit server endpoints (`+server.ts`) that translate dashboard
  filters into parameterized ClickHouse SQL. Centralize query-building in `packages/db`
  and **always parameterize** (no string interpolation → no SQL injection).
- **Charts:** uPlot for the time-series (fast, tiny) with custom-styled tooltips/gradients;
  LayerChart/D3 for richer breakdown visuals where needed.
- **UI — unique, beautiful, modern, polished, animated** (an explicit product goal, not an
  afterthought):
  - **Design language:** distinctive, not a generic dashboard. Considered typography
    (e.g. a strong display face + clean mono for numbers), a cohesive custom color system
    with light/dark themes, generous spacing, subtle depth (soft shadows, layered cards,
    optional glassmorphism), and a memorable accent. Aim for a signature look closer to
    Linear/Vercel/Plausible-but-bolder than stock admin templates.
  - **Component base:** Tailwind + shadcn-svelte as primitives, then **heavily themed** so
    it doesn't look like default shadcn. Build a small design-token layer first (colors,
    radii, shadows, motion timings) so polish is consistent everywhere.
  - **Motion:** purposeful animation throughout — page/route transitions (Svelte
    `crossfade`/view transitions), number count-ups on the stat cards, chart line
    draw-in and animated tooltips, staggered list reveals on breakdown panels, smooth
    filter transitions, skeleton loaders, and micro-interactions on hover/press. Use
    Svelte transitions + `svelte/motion` (spring/tweened); reach for Motion One/GSAP for
    anything more elaborate. Respect `prefers-reduced-motion`.
  - **Feel:** fast and fluid — optimistic UI on filters, no janky reflows, 60fps charts.
  - **Polish pass** is a named milestone in phase 6, but tokens + motion primitives are
    set up early so every screen is built polished from the start.
  - **Marketing site** gets the same treatment: a striking animated landing page (hero,
    live demo dashboard, privacy story) since look-and-feel is a core differentiator vs GA.
- **Settings:** site management, team members/roles, timezone, data retention, public
  dashboard toggle, billing.

### 4. Billing / multi-tenancy (Stripe)
- Plans by **monthly pageview tiers** (e.g. 10k / 100k / 1M / custom), monthly+annual.
- Stripe Checkout for subscribe; Customer Portal for plan changes/cancellation.
- **Webhook handler** (`checkout.session.completed`, `customer.subscription.updated/deleted`,
  `invoice.payment_failed`) → sync `subscriptions` table. Verify webhook signatures.
- **Plan-limit enforcement:** ingestor checks org monthly usage against plan cap; over
  limit → soft-degrade (keep counting but flag + email) rather than hard-drop, and surface
  an upgrade banner in the dashboard. Track usage in the `usage` table.
- Org is the tenant boundary; every query is scoped by `org_id`/`site_id`.

---

## Build phases (suggested order)

1. **Foundation** — monorepo (pnpm + Turbo), `docker-compose` for Postgres + ClickHouse,
   Drizzle schema + ClickHouse DDL, shared zod/types package.
2. **Data pipeline end-to-end** — tracker → ingestor → ClickHouse, verified with a real
   beacon. (Prove the hot path before building UI.)
3. **Auth + sites + onboarding** — SvelteKit auth, org/site CRUD, snippet + verify.
4. **Dashboard read layer** — query builder in `packages/db`, the core dashboard screen
   with cards + time chart + breakdown panels and click-to-filter.
5. **Billing** — Stripe Checkout, webhooks, plan limits + usage tracking.
6. **Polish** — bot filtering quality, public/shared dashboards, goals/custom events,
   rollup materialized views for performance, retention TTLs, marketing/privacy pages.

---

## Key technical risks & mitigations
- **Small-insert storms into ClickHouse** → mandatory batching/buffering in the ingestor.
- **Bot/spam traffic inflating counts** → UA bot list + heuristics at ingest; revisit.
- **Geo/UA lib licensing & accuracy** → use GeoLite2 (license note) or a paid IP API.
- **Query cost as data grows** → add pre-aggregated MVs once raw queries slow down; don't
  prematurely build them.
- **GDPR claims** → keep the no-PII guarantee real (never persist IP/UA); document it.

---

## Verification
- **Pipeline:** run `docker-compose up`, start the ingestor, load a test HTML page with
  the snippet, navigate a few routes, then query ClickHouse
  (`SELECT count() , name FROM events WHERE site_id=… GROUP BY name`) to confirm events
  with correct geo/device and a stable same-day `visitor_id`.
- **Privacy:** confirm no cookies/localStorage set (DevTools), and that raw IP/UA never
  appear in any stored row.
- **Dashboard:** numbers in the UI match direct ClickHouse aggregate queries for the same
  range; click-to-filter narrows all panels correctly.
- **Billing:** Stripe test-mode checkout → webhook updates `subscriptions`; simulate
  over-limit usage → upgrade banner + soft-degrade behavior.
- **Load smoke test:** fire a few thousand beacons (k6/autocannon) at the ingestor and
  confirm batched inserts keep up and `/event` stays fast (`202`, low latency).

## Open/deferred (not in MVP)
Auto outbound-link/file-download tracking, funnels, retention cohorts, email reports,
extracting the ingestor to Go/edge, EU data residency.
