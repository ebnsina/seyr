# seyr

Privacy-first, cookieless web analytics — a clean, fast alternative to Google Analytics.

- **No cookies, no PII** — GDPR/CCPA-friendly by design, no cookie banner required.
- **Lightweight tracker** — a tiny (<1KB) embeddable script.
- **Fast dashboards** — events stored in ClickHouse for instant aggregate queries.
- **Full SaaS** — multi-tenant orgs, SSLCommerz (BDT) billing, plan limits.

## Architecture

```
tracker.js  ──beacon──▶  ingestor (Go)  ──batch──▶  ClickHouse  (events)
                                                          ▲
dashboard (SvelteKit)  ──────────────read queries────────┘
        │
        └──▶ Postgres  (users, orgs, sites, billing)
```

| Package            | What it is                                                       |
| ------------------ | ---------------------------------------------------------------- |
| `apps/dashboard`   | SvelteKit app — UI, auth, billing, read API                      |
| `apps/ingestor`    | Go service — event ingestion + batched ClickHouse writer         |
| `packages/tracker` | Source for the embeddable browser script                         |
| `packages/db`      | Drizzle schema/migrations (Postgres) + ClickHouse client         |
| `packages/shared`  | Shared zod schemas, parsing helpers, config/types               |

## Getting started

Requires Node 22+, pnpm 11+, Go 1.24+, and Docker.

```bash
pnpm install
cp .env.example .env
pnpm infra:up        # start Postgres + ClickHouse
pnpm dev             # run JS apps/packages (dashboard, tracker) via Turborepo
pnpm ingestor:dev    # run the Go ingestion service
```
