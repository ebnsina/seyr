# infra

Local development services.

```bash
# from repo root
pnpm infra:up      # docker compose up -d
pnpm infra:down    # stop
```

- **Postgres 17** — `localhost:5432` (relational data; migrated via Drizzle from `packages/db`).
- **ClickHouse 24.12** — HTTP on `localhost:8123`, native on `:9000` (event store).

The ClickHouse `events` table is created on first boot from `clickhouse/init/*.sql`.
That DDL is the source mirrored by `packages/db/src/clickhouse/schema.sql` — if you change
one, change the other.

To re-run init scripts after editing them, recreate the volume:

```bash
docker compose -f infra/docker-compose.yml down -v && pnpm infra:up
```
