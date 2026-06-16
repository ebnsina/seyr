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

See [plan.md](./plan.md) for the full build plan.

## Deploying to a VPS

A single Ubuntu VPS (2 vCPU / 4 GB is plenty to start) running everything behind
Caddy for automatic TLS. Postgres and ClickHouse run in Docker; the Go ingestor and
the SvelteKit dashboard run as systemd services. Caddy fronts all three:

```
yourdomain.com        → dashboard (:3000)
yourdomain.com/i      → ingestor  (:4000)   ← beacon endpoint
cdn.yourdomain.com/seyr.js → static tracker file
```

### 1. Provision

```bash
# as root on a fresh Ubuntu 24.04 box
apt update && apt install -y git curl
curl -fsSL https://get.docker.com | sh                      # Docker
curl -fsSL https://deb.nodesource.com/setup_22.x | bash - && apt install -y nodejs
npm i -g pnpm                                               # pnpm
# Go (for building the ingestor)
curl -fsSL https://go.dev/dl/go1.24.0.linux-amd64.tar.gz | tar -C /usr/local -xz
echo 'export PATH=$PATH:/usr/local/go/bin' >> /etc/profile && source /etc/profile
# Caddy (reverse proxy + TLS)
apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy.gpg
echo "deb [signed-by=/usr/share/keyrings/caddy.gpg] https://dl.cloudsmith.io/public/caddy/stable/deb/debian any-version main" > /etc/apt/sources.list.d/caddy.list
apt update && apt install -y caddy
```

### 2. Clone, configure, build

```bash
git clone git@github.com:ebsina/seyr.git /opt/seyr && cd /opt/seyr
pnpm install --frozen-lockfile
cp .env.example .env && nano .env        # see "Production env" below
pnpm infra:up                            # Postgres + ClickHouse (bound to localhost)

# Apply schema
set -a && . .env && set +a
pnpm --filter @seyr/db db:migrate

# Load the ClickHouse rollup MV (init scripts only run on a fresh volume)
docker exec -i seyr-clickhouse-1 clickhouse-client -u "$CLICKHOUSE_USER" --password "$CLICKHOUSE_PASSWORD" \
  --multiquery < packages/db/src/clickhouse/rollups.sql

# Build everything
pnpm --filter @seyr/dashboard build                       # → apps/dashboard/build
pnpm --filter @seyr/tracker build                         # → packages/tracker/dist/seyr.js
( cd apps/ingestor && go build -o bin/ingestor ./cmd/ingestor )

# Publish the tracker so Caddy can serve it
mkdir -p /var/www/seyr && cp packages/tracker/dist/seyr.js /var/www/seyr/seyr.js
```

### 3. Production env (`/opt/seyr/.env`)

```bash
DATABASE_URL=postgresql://seyr:STRONG_PW@localhost:55432/seyr
POSTGRES_PASSWORD=STRONG_PW
CLICKHOUSE_ADDR=localhost:9000
CLICKHOUSE_URL=http://localhost:8123
CLICKHOUSE_PASSWORD=STRONG_PW
INGEST_SALT_SECRET=$(openssl rand -hex 32)   # long random secret
ORIGIN=https://yourdomain.com
PUBLIC_INGEST_HOST=https://cdn.yourdomain.com # where seyr.js + beacons are served
NODE_ENV=production
# Billing (SSLCommerz) — start in mock, switch to sandbox/live when ready
SSLCZ_MODE=mock
SSLCZ_STORE_ID=
SSLCZ_STORE_PASSWD=
CRON_SECRET=$(openssl rand -hex 24)          # protects the renewal cron
```

> **Security:** the Docker compose binds Postgres/ClickHouse to localhost only — do
> not expose 5432/8123/9000 publicly. Use strong DB passwords and a long
> `INGEST_SALT_SECRET`.

### 4. systemd services

`/etc/systemd/system/seyr-dashboard.service`:

```ini
[Unit]
Description=seyr dashboard
After=network.target docker.service

[Service]
WorkingDirectory=/opt/seyr/apps/dashboard
EnvironmentFile=/opt/seyr/.env
Environment=PORT=3000
ExecStart=/usr/bin/node build
Restart=always
User=www-data

[Install]
WantedBy=multi-user.target
```

`/etc/systemd/system/seyr-ingestor.service`:

```ini
[Unit]
Description=seyr ingestor
After=network.target docker.service

[Service]
WorkingDirectory=/opt/seyr/apps/ingestor
EnvironmentFile=/opt/seyr/.env
ExecStart=/opt/seyr/apps/ingestor/bin/ingestor
Restart=always
User=www-data

[Install]
WantedBy=multi-user.target
```

```bash
systemctl daemon-reload
systemctl enable --now seyr-dashboard seyr-ingestor
```

### 5. Caddy (`/etc/caddy/Caddyfile`)

```caddy
yourdomain.com {
	# Beacon endpoint → ingestor
	handle /i* {
		reverse_proxy localhost:4000
	}
	# Everything else → dashboard
	reverse_proxy localhost:3000
}

cdn.yourdomain.com {
	root * /var/www/seyr
	file_server
	# Beacons can also be sent here (first-party proxy mode)
	handle /i* {
		reverse_proxy localhost:4000
	}
}
```

```bash
systemctl reload caddy
```

### 6. Auto-renew cron

```bash
# /etc/cron.d/seyr-renew — charge due auto-renew subscriptions hourly
0 * * * * www-data curl -fsS -X POST https://yourdomain.com/billing/cron/renew \
  -H "x-cron-secret: YOUR_CRON_SECRET" >/dev/null 2>&1
```

### Updating

```bash
cd /opt/seyr && git pull && pnpm install --frozen-lockfile
set -a && . .env && set +a && pnpm --filter @seyr/db db:migrate
pnpm --filter @seyr/dashboard build
pnpm --filter @seyr/tracker build && cp packages/tracker/dist/seyr.js /var/www/seyr/seyr.js
( cd apps/ingestor && go build -o bin/ingestor ./cmd/ingestor )
systemctl restart seyr-dashboard seyr-ingestor
```
