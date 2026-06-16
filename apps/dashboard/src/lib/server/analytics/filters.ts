/**
 * Translates dashboard filters into a parameterized ClickHouse WHERE clause.
 * Filter keys map to a fixed whitelist of columns, and every value is bound as a
 * query parameter — so no user input is ever interpolated into SQL.
 */

/** Filterable dimensions → their ClickHouse column. */
export const FILTER_COLUMNS = {
	page: 'pathname',
	source: 'referrer_source',
	country: 'country_code',
	device: 'device',
	browser: 'browser',
	os: 'os',
	utm_source: 'utm_source',
	utm_medium: 'utm_medium',
	utm_campaign: 'utm_campaign'
} as const;

export type FilterKey = keyof typeof FILTER_COLUMNS;
export type Filters = Partial<Record<FilterKey, string>>;

export interface DateRange {
	/** Inclusive start (ms since epoch). */
	from: number;
	/** Exclusive end (ms since epoch). */
	to: number;
}

export interface QueryScope {
	siteId: bigint;
	range: DateRange;
	timezone: string;
	filters: Filters;
}

function toClickHouseDateTime(ms: number): string {
	// 'YYYY-MM-DD HH:MM:SS' in UTC — bound as a String and parsed CH-side.
	return new Date(ms).toISOString().slice(0, 19).replace('T', ' ');
}

export interface BuiltWhere {
	clause: string;
	params: Record<string, unknown>;
}

/** Build the shared WHERE clause (site + time window + active filters). */
export function buildWhere(scope: QueryScope): BuiltWhere {
	const params: Record<string, unknown> = {
		siteId: scope.siteId.toString(),
		from: toClickHouseDateTime(scope.range.from),
		to: toClickHouseDateTime(scope.range.to)
	};

	const parts = [
		'site_id = {siteId:UInt64}',
		'timestamp >= parseDateTimeBestEffort({from:String})',
		'timestamp < parseDateTimeBestEffort({to:String})'
	];

	for (const [key, column] of Object.entries(FILTER_COLUMNS)) {
		const value = scope.filters[key as FilterKey];
		if (value === undefined || value === '') continue;
		const param = `f_${key}`;
		params[param] = value;
		parts.push(`${column} = {${param}:String}`);
	}

	return { clause: parts.join(' AND '), params };
}
