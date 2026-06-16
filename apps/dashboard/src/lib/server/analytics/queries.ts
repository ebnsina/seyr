import { EVENTS_TABLE } from '@seyr/db/clickhouse';
import { ch } from '../clickhouse';
import { buildWhere, type QueryScope } from './filters';

async function queryRows<T>(query: string, params: Record<string, unknown>): Promise<T[]> {
	const rs = await ch.query({ query, query_params: params, format: 'JSONEachRow' });
	return (await rs.json()) as T[];
}

export interface Totals {
	visitors: number;
	pageviews: number;
	bounceRate: number; // 0..1
	avgDuration: number; // seconds
}

/** Visitors + pageviews + engagement for a scope. */
export async function getTotals(scope: QueryScope): Promise<Totals> {
	const { clause, params } = buildWhere(scope);

	const [top] = await queryRows<{ visitors: string; pageviews: string }>(
		`SELECT uniq(visitor_id) AS visitors, countIf(name = 'pageview') AS pageviews
		 FROM ${EVENTS_TABLE} WHERE ${clause}`,
		params
	);

	const [eng] = await queryRows<{ sessions: string; bounced: string; avg_dur: number }>(
		`SELECT count() AS sessions, countIf(pv = 1) AS bounced, avg(dur) AS avg_dur FROM (
			SELECT session_id, countIf(name = 'pageview') AS pv,
				dateDiff('second', min(timestamp), max(timestamp)) AS dur
			FROM ${EVENTS_TABLE} WHERE ${clause} GROUP BY session_id
		)`,
		params
	);

	const sessions = Number(eng?.sessions ?? 0);
	return {
		visitors: Number(top?.visitors ?? 0),
		pageviews: Number(top?.pageviews ?? 0),
		bounceRate: sessions > 0 ? Number(eng?.bounced ?? 0) / sessions : 0,
		avgDuration: Math.round(eng?.avg_dur ?? 0)
	};
}

export interface TimeseriesPoint {
	bucket: string;
	visitors: number;
	pageviews: number;
}

const DAILY_ROLLUP = 'events_daily';

function hasActiveFilters(scope: QueryScope): boolean {
	return Object.values(scope.filters).some((v) => v !== undefined && v !== '');
}

/**
 * Daily series from the pre-aggregated rollup (AggregatingMergeTree). Used for
 * unfiltered daily ranges — far cheaper than scanning raw events at scale.
 */
async function getTimeseriesFromRollup(scope: QueryScope): Promise<TimeseriesPoint[]> {
	const from = new Date(scope.range.from).toISOString().slice(0, 19).replace('T', ' ');
	const to = new Date(scope.range.to).toISOString().slice(0, 19).replace('T', ' ');
	const rows = await queryRows<{ bucket: string; visitors: string; pageviews: string }>(
		`SELECT toString(date) AS bucket, sum(pageviews) AS pageviews, uniqMerge(visitors) AS visitors
		 FROM ${DAILY_ROLLUP}
		 WHERE site_id = {siteId:UInt64}
		   AND date >= toDate(parseDateTimeBestEffort({from:String}))
		   AND date <= toDate(parseDateTimeBestEffort({to:String}))
		 GROUP BY date ORDER BY date WITH FILL
			FROM toDate(parseDateTimeBestEffort({from:String}))
			TO toDate(parseDateTimeBestEffort({to:String})) + 1 STEP 1`,
		{ siteId: scope.siteId.toString(), from, to }
	);
	return rows.map((r) => ({
		// Normalize to the same shape the raw query returns for the chart.
		bucket: `${r.bucket} 00:00:00`,
		visitors: Number(r.visitors),
		pageviews: Number(r.pageviews)
	}));
}

/** Visitors/pageviews over time, zero-filled into continuous buckets. */
export async function getTimeseries(scope: QueryScope): Promise<TimeseriesPoint[]> {
	const spanMs = scope.range.to - scope.range.from;
	const hourly = spanMs <= 1000 * 60 * 60 * 48;

	// Daily + unfiltered → serve from the rollup; otherwise scan raw events.
	if (!hourly && !hasActiveFilters(scope)) return getTimeseriesFromRollup(scope);

	const { clause, params } = buildWhere(scope);
	const fn = hourly ? 'toStartOfHour' : 'toStartOfDay';
	const step = hourly ? 'toIntervalHour(1)' : 'toIntervalDay(1)';

	const rows = await queryRows<{ bucket: string; visitors: string; pageviews: string }>(
		`SELECT ${fn}(timestamp, {tz:String}) AS bucket,
			uniq(visitor_id) AS visitors, countIf(name = 'pageview') AS pageviews
		 FROM ${EVENTS_TABLE} WHERE ${clause}
		 GROUP BY bucket ORDER BY bucket WITH FILL
			FROM ${fn}(parseDateTimeBestEffort({from:String}), {tz:String})
			TO ${fn}(parseDateTimeBestEffort({to:String}), {tz:String})
			STEP ${step}`,
		{ ...params, tz: scope.timezone }
	);
	return rows.map((r) => ({
		bucket: r.bucket,
		visitors: Number(r.visitors),
		pageviews: Number(r.pageviews)
	}));
}

/** Breakdown dimensions → their column (separate whitelist from filters). */
export const BREAKDOWN_COLUMNS = {
	page: 'pathname',
	source: 'referrer_source',
	country: 'country_code',
	browser: 'browser',
	os: 'os',
	device: 'device'
} as const;

export type BreakdownKey = keyof typeof BREAKDOWN_COLUMNS;

export interface BreakdownRow {
	label: string;
	visitors: number;
	pageviews: number;
}

export interface CustomEventRow {
	label: string; // event name
	count: number; // total occurrences (conversions)
	visitors: number; // unique visitors who triggered it
}

/** Top custom events (everything that isn't a pageview), ranked by occurrences. */
export async function getCustomEvents(scope: QueryScope, limit = 8): Promise<CustomEventRow[]> {
	const { clause, params } = buildWhere(scope);
	const rows = await queryRows<{ label: string; count: string; visitors: string }>(
		`SELECT name AS label, count() AS count, uniq(visitor_id) AS visitors
		 FROM ${EVENTS_TABLE} WHERE ${clause} AND name != 'pageview'
		 GROUP BY label ORDER BY count DESC LIMIT {limit:UInt32}`,
		{ ...params, limit }
	);
	return rows.map((r) => ({
		label: r.label,
		count: Number(r.count),
		visitors: Number(r.visitors)
	}));
}

/** Top values for a dimension, ranked by unique visitors. */
export async function getBreakdown(
	scope: QueryScope,
	dimension: BreakdownKey,
	limit = 8
): Promise<BreakdownRow[]> {
	const column = BREAKDOWN_COLUMNS[dimension]; // whitelisted identifier, never user input
	const { clause, params } = buildWhere(scope);

	const rows = await queryRows<{ label: string; visitors: string; pageviews: string }>(
		`SELECT ${column} AS label, uniq(visitor_id) AS visitors, countIf(name = 'pageview') AS pageviews
		 FROM ${EVENTS_TABLE} WHERE ${clause} AND ${column} != ''
		 GROUP BY label ORDER BY visitors DESC LIMIT {limit:UInt32}`,
		{ ...params, limit }
	);
	return rows.map((r) => ({
		label: r.label,
		visitors: Number(r.visitors),
		pageviews: Number(r.pageviews)
	}));
}
