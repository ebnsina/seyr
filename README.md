# seyr

Privacy-first, cookieless web analytics — a clean, fast alternative to Google Analytics,
in the spirit of Plausible and Fathom.

- **No cookies, no PII** — GDPR/CCPA-friendly by design, no cookie banner required.
- **Lightweight tracker** — a tiny (<1KB) embeddable script.
- **Fast dashboards** — events stored in ClickHouse for instant aggregate queries.
- **Full SaaS** — multi-tenant orgs, Stripe billing, plan limits.

## Architecture

```
tracker.js  ──beacon──▶  ingestor (Bun + Hono)  ──batch──▶  ClickHouse  (events)
                                                                  ▲
dashboard (SvelteKit)  ──────────────────read queries────────────┘
        │
        └──▶ Postgres  (users, orgs, sites, billing)
```

| Package            | What it is                                                       |
| ------------------ | ---------------------------------------------------------------- |
| `apps/dashboard`   | SvelteKit app — UI, auth, billing, read API                      |
| `apps/ingestor`    | Bun + Hono service — event ingestion + batched ClickHouse writer |
| `packages/tracker` | Source for the embeddable browser script                         |
| `packages/db`      | Drizzle schema/migrations (Postgres) + ClickHouse client         |
| `packages/shared`  | Shared zod schemas, parsing helpers, config/types               |

## Getting started

Requires Node 22+, pnpm 11+, Bun 1.3+, and Docker.

```bash
pnpm install
cp .env.example .env
pnpm infra:up      # start Postgres + ClickHouse
pnpm dev           # run all apps
```

See [plan.md](./plan.md) for the full build plan.
