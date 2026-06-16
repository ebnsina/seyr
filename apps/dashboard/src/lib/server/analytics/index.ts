import {
	getBreakdown,
	getTimeseries,
	getTotals,
	type BreakdownKey,
	type BreakdownRow,
	type TimeseriesPoint,
	type Totals
} from './queries';
import { previousRange } from './ranges';
import type { QueryScope } from './filters';

export * from './filters';
export * from './queries';
export * from './ranges';

const BREAKDOWNS: BreakdownKey[] = ['page', 'source', 'country', 'browser', 'os', 'device'];

export interface Dashboard {
	totals: Totals;
	previous: Totals;
	timeseries: TimeseriesPoint[];
	breakdowns: Record<BreakdownKey, BreakdownRow[]>;
}

/** Run every dashboard query for a scope concurrently and assemble the payload. */
export async function getDashboard(scope: QueryScope): Promise<Dashboard> {
	const prevScope: QueryScope = { ...scope, range: previousRange(scope.range) };

	const [totals, previous, timeseries, ...breakdownResults] = await Promise.all([
		getTotals(scope),
		getTotals(prevScope),
		getTimeseries(scope),
		...BREAKDOWNS.map((d) => getBreakdown(scope, d))
	]);

	const breakdowns = Object.fromEntries(
		BREAKDOWNS.map((d, i) => [d, breakdownResults[i]!])
	) as Record<BreakdownKey, BreakdownRow[]>;

	return { totals, previous, timeseries, breakdowns };
}
