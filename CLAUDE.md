# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

**seyr** — privacy-first, cookieless web analytics; a clean, fast alternative to Google Analytics.
pnpm + Turborepo monorepo. Two runtimes: **SvelteKit** (dashboard) and **Go** (ingestor). Two data
stores: **Postgres** (relational) and **ClickHouse** (events). See `README.md` for the product
pitch and a full VPS deploy guide; `plan.md` for the original build plan.

## Layout

| Path                | What it is                                                            |
| ------------------- | --------------------------------------------------------------------- |
| `apps/dashboard`    | SvelteKit 2 / Svelte 5 app — marketing site, auth, sites, analytics, billing |
| `apps/ingestor`     | Go service — beacon ingestion, geo/device/visitor derivation, batched CH writes |
| `packages/shared`   | zod beacon schema, URL/referrer parsers, config (TS, used by dashboard + tracker) |
| `packages/db`       | Drizzle Postgres schema/migrations + ClickHouse client/DDL            |
| `packages/tracker`  | the embeddable browser script (built to `dist/seyr.js`)               |
| `infra/`            | docker-compose (Postgres + ClickHouse) + ClickHouse init SQL          |

## Commands

```bash
pnpm install
cp .env.example .env            # then EDIT: local Postgres is on host port 55432, not 5432
pnpm infra:up                   # docker compose Postgres + ClickHouse (scripts pass --env-file)
pnpm infra:down

pnpm dev                        # JS apps/packages via Turborepo (dashboard, tracker) — NOT the ingestor
pnpm ingestor:dev               # the Go ingestor (separate; Turbo does not run Go)
pnpm build                      # turbo build (JS); pnpm ingestor:build for the Go binary
pnpm test                       # turbo test (shared + dashboard vitest)
```

Most real work targets one package — `pnpm --filter @seyr/dashboard <script>`
(`dev`/`build`/`test`/`typecheck`). The dashboard has **no eslint**; `typecheck` runs
`svelte-check`.

**Single test:**
- vitest: `pnpm --filter @seyr/dashboard exec vitest run src/lib/.../x.test.ts` (or `-t "name"`).
- Go: `cd apps/ingestor && go test ./internal/event -run TestIsBot`.

**Database (Drizzle, from `packages/db`):** `pnpm --filter @seyr/db db:generate` / `db:migrate`.
These read `DATABASE_URL` from the env — load `.env` first (`set -a && . .env && set +a`) or pass
it inline. `db:generate` prompts interactively on ambiguous column rename/drop, which **breaks in
non-interactive shells** — for pre-release schema changes the pragmatic move is to delete
`packages/db/migrations`, regenerate a clean baseline, and `DROP SCHEMA public CASCADE` + re-migrate.

## Environment gotchas (these cause "it doesn't connect" confusion)

- **Postgres host port is `55432`** (5432/5433 were occupied during dev). `DATABASE_URL` in `.env`
  must use it. docker-compose reads its env from `--env-file .env` (the compose file lives in
  `infra/`, so it would otherwise look there) — the `pnpm infra:*` scripts already pass this.
- **ClickHouse has two ports/clients:** the dashboard uses the **HTTP** interface
  (`CLICKHOUSE_URL`, `:8123`); the Go ingestor uses the **native** protocol
  (`CLICKHOUSE_ADDR`, `:9000`). Set both.
- **ClickHouse DDL in `infra/clickhouse/init/*.sql` only runs on a fresh volume.** After editing it
  (or on an existing volume) apply changes manually via `clickhouse-client`. Those files are
  **mirrored** in `packages/db/src/clickhouse/*.sql` — keep both in sync.
- Tests + migrations against the live DB require the env loaded; the dashboard's integration tests
  otherwise **self-skip** (see Testing).

## Architecture (the parts that span files)

**The ingestor is deliberately decoupled from the TS code.** It shares no source with the
dashboard — it reimplements the small amount of pure parsing logic (URL/referrer, validation,
limits) that `packages/shared` provides on the TS side. The real contract between them is the
**beacon wire format** and the **Postgres/ClickHouse schemas** (owned by `packages/db` + `infra`).
This is why the monorepo matters: a schema change touches the DDL, the Go insert, and a TS query in
one commit. When changing the events schema, update **all** of: `infra/clickhouse/init`,
`packages/db/src/clickhouse`, the ingestor's `internal/store/clickhouse.go` (`insertColumns` + Row),
and the dashboard's analytics queries.

**Request flow (ingestion):** tracker beacon → `POST /i` (neutral path, ad-blocker-resistant) →
bot filter → zod-style validate → resolve site (domain→site_id, cached) → derive geo (CDN headers)
+ device (UA) + daily-rotating **visitor hash** (IP & UA consumed then discarded — **no PII stored**)
→ in-memory buffer → batched insert to ClickHouse. The ingestor also tracks per-org monthly usage in
the `usage` table and enforces plan limits (`INGEST_OVER_LIMIT_MODE`: `soft` keeps counting, `block`
drops over-limit events).

**`site_id` is one key across both stores:** a bigint identity PK in Postgres `sites` that doubles
as the ClickHouse `events.site_id` (UInt64).

**Analytics read path (`apps/dashboard/src/lib/server/analytics`):** all queries go through
`buildWhere`, which maps a **whitelist** of filter keys to columns and binds every value as a
ClickHouse query parameter — never interpolate user input into SQL. `getTimeseries` serves
**unfiltered daily** ranges from the `events_daily` rollup (AggregatingMergeTree, `uniqMerge`) and
falls back to raw events for hourly/filtered queries. Caveat: `Array(UInt64)` query params must be
passed as JS **numbers**, not strings (the client quotes string array elements and CH rejects them).

**Auth & tenancy (`apps/dashboard/src/lib/server/auth`, `hooks.server.ts`):** argon2 passwords;
session token (oslo) whose **SHA-256 is the `sessions.id`** (raw token only in the cookie). The
handle hook populates `locals.user`. Signup creates user + first org + owner membership atomically.
**Everything is org-scoped** — server queries filter by the acting user's org, and cross-org access
returns 404. Routes: `(marketing)` (public), `(auth)` (redirects logged-in users away), `(app)`
(guarded). `/` redirects authed users to `/sites`. Public dashboards are unauthenticated at
`/share/[token]` and resolve only while `is_public` is true.

**Billing (`apps/dashboard/src/lib/server/payments`, `billing.ts`):** provider-agnostic
`PaymentProvider` interface with an **SSLCommerz** adapter (Bangladesh; cards + bKash/Nagad/Rocket)
and a **MockProvider** for local dev — `getProvider()` chooses via `SSLCZ_MODE` (`mock` default).
Gateway callbacks (`/billing/callback/*`, `/billing/ipn`) are **session-independent** (the gateway
redirect is cross-site) — they authorize via the payment record + gateway-validated `val_id`, and are
**idempotent**. Auto-renew runs via the secret-protected cron at `/billing/cron/renew`. Plans/prices
are in BDT in `$lib/billing/plans.ts`.

## Frontend conventions

- **Custom UI primitives, no component library.** `$lib/components/ui` (Button, Card, Input, Badge,
  Logo, ThemeToggle, AnimatedNumber). Don't reach for shadcn.
- **Design tokens in `src/app.css`** (Tailwind v4, CSS-first). Semantic colors are OKLCH CSS vars
  mapped into utilities via `@theme inline`; light/dark just swap the vars. Accent is **lime**; the
  look is **flat (no box-shadows)**. Fonts: Clash Display (display) + Satoshi (body, Fontshare) +
  Geist Mono. Breakdown panels each take a distinct `barColor`.
- Marketing/auth/app each have their own layout; `reveal` action (`$lib/actions`) does scroll-in.

## Other gotchas

- `packages/db` uses **extensionless** relative imports (drizzle-kit's CJS loader can't resolve
  `.js`); it's always bundled by consumers so this is fine. The tracker imports the **zod-free**
  `@seyr/shared/config` subpath to stay under 1KB (build.js warns if the bundle exceeds it).
- `vite.config.ts`'s `test` field is hand-typed alongside `UserConfig` to dodge a vitest/vite
  type-version skew — don't switch it back to `defineConfig` from `vitest/config`.

## Testing

- Unit tests run with zero infra and must stay green (`pnpm test`).
- The dashboard's **integration tests** (`src/lib/server/integration.test.ts`) hit real Postgres and
  **self-skip when it's unreachable**. To actually run them: `pnpm infra:up`, load `.env`, then
  `pnpm --filter @seyr/dashboard test` — they cover the security-critical paths (auth, org-scoping,
  public-dashboard tokens, payment idempotency).
- Go: `cd apps/ingestor && go test ./...` (pipeline no-PII/hash + bot filtering).
- For manual end-to-end verification, the established loop is: `pnpm infra:up`, start the ingestor
  and dashboard with `.env` loaded, then curl beacons at `:4000/i` and query ClickHouse over HTTP.
