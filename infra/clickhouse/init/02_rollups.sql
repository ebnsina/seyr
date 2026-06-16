-- Daily per-site rollup for fast unfiltered time-series / totals at scale.
-- The dashboard reads this for daily, unfiltered ranges and falls back to the
-- raw events table for hourly or filtered queries.
-- Mirrors packages/db/src/clickhouse/rollups.sql — keep the two in sync.

CREATE TABLE IF NOT EXISTS seyr.events_daily
(
    site_id   UInt64,
    date      Date,
    pageviews SimpleAggregateFunction(sum, UInt64),
    visitors  AggregateFunction(uniq, UInt64)
)
ENGINE = AggregatingMergeTree
PARTITION BY toYYYYMM(date)
ORDER BY (site_id, date)
-- Keep aggregates longer than raw events (raw TTL is shorter per plan).
TTL date + INTERVAL 60 MONTH;

CREATE MATERIALIZED VIEW IF NOT EXISTS seyr.events_daily_mv TO seyr.events_daily AS
SELECT
    site_id,
    toDate(timestamp) AS date,
    countIf(name = 'pageview') AS pageviews,
    uniqState(visitor_id) AS visitors
FROM seyr.events
GROUP BY site_id, date;
