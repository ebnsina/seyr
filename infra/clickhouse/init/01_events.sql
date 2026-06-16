-- seyr event store — runs on first ClickHouse boot (docker-entrypoint-initdb.d).
-- Mirrors packages/db/src/clickhouse/schema.sql; keep the two in sync.

CREATE DATABASE IF NOT EXISTS seyr;

CREATE TABLE IF NOT EXISTS seyr.events
(
    -- tenancy / time
    site_id          UInt64,
    timestamp        DateTime DEFAULT now(),

    -- event identity
    name             LowCardinality(String) DEFAULT 'pageview',
    -- daily-rotating hash(salt + ip + ua + domain): NOT durable, not PII.
    visitor_id       UInt64,
    session_id       UInt64,
    is_bounce        UInt8 DEFAULT 1,
    duration         UInt32 DEFAULT 0,           -- seconds on page (filled by close beacon)

    -- page
    hostname         LowCardinality(String),
    pathname         String,

    -- acquisition
    referrer         String DEFAULT '',
    referrer_source  LowCardinality(String) DEFAULT '',
    utm_source       LowCardinality(String) DEFAULT '',
    utm_medium       LowCardinality(String) DEFAULT '',
    utm_campaign     LowCardinality(String) DEFAULT '',

    -- geo (derived from IP, IP discarded)
    country_code     LowCardinality(FixedString(2)) DEFAULT '\0\0',
    region           LowCardinality(String) DEFAULT '',
    city             LowCardinality(String) DEFAULT '',

    -- device (derived from UA, UA discarded)
    browser          LowCardinality(String) DEFAULT '',
    browser_version  LowCardinality(String) DEFAULT '',
    os               LowCardinality(String) DEFAULT '',
    os_version       LowCardinality(String) DEFAULT '',
    device           LowCardinality(String) DEFAULT '',   -- desktop | mobile | tablet

    -- custom event props (key/value arrays — queried with arrayJoin)
    prop_keys        Array(String),
    prop_values      Array(String)
)
ENGINE = MergeTree
PARTITION BY toYYYYMM(timestamp)
ORDER BY (site_id, toDate(timestamp), name, visitor_id)
TTL timestamp + INTERVAL 36 MONTH       -- raw retention ceiling; per-plan TTL applied later
SETTINGS index_granularity = 8192;
