import { error } from '@sveltejs/kit';
import {
	FILTER_COLUMNS,
	getDashboard,
	isRangePreset,
	resolveRange,
	type Filters,
	type RangePreset
} from '$lib/server/analytics';
import { getSite } from '$lib/server/sites';
import type { PageServerLoad } from './$types';

const EMPTY_TOTALS = { visitors: 0, pageviews: 0, bounceRate: 0, avgDuration: 0 };

export const load: PageServerLoad = async ({ params, url, parent }) => {
	const { currentOrg } = await parent();
	if (!currentOrg || !/^\d+$/.test(params.id)) error(404, 'Site not found');

	const site = await getSite(BigInt(params.id), currentOrg.id);
	if (!site) error(404, 'Site not found');

	const rangeParam = url.searchParams.get('range') ?? '30d';
	const range: RangePreset = isRangePreset(rangeParam) ? rangeParam : '30d';

	const filters: Filters = {};
	for (const key of Object.keys(FILTER_COLUMNS) as (keyof typeof FILTER_COLUMNS)[]) {
		const v = url.searchParams.get(key);
		if (v) filters[key] = v;
	}

	const scope = {
		siteId: site.id,
		range: resolveRange(range),
		timezone: site.timezone,
		filters
	};

	// Degrade gracefully if ClickHouse is unavailable.
	let dashboard;
	try {
		dashboard = await getDashboard(scope);
	} catch (e) {
		console.error('[stats] query failed', e);
		dashboard = {
			totals: EMPTY_TOTALS,
			previous: EMPTY_TOTALS,
			timeseries: [],
			breakdowns: { page: [], source: [], country: [], browser: [], os: [], device: [] },
			customEvents: []
		};
	}

	return {
		site: { id: site.id.toString(), domain: site.domain },
		range,
		filters,
		dashboard
	};
};
