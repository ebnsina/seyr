import { error } from '@sveltejs/kit';
import { getDashboard, isRangePreset, resolveRange, type RangePreset } from '$lib/server/analytics';
import { getPublicSiteByToken } from '$lib/server/sites';
import type { PageServerLoad } from './$types';

const EMPTY_TOTALS = { visitors: 0, pageviews: 0, bounceRate: 0, avgDuration: 0 };

export const load: PageServerLoad = async ({ params, url }) => {
	const site = await getPublicSiteByToken(params.token);
	if (!site) error(404, 'This dashboard is not available');

	const rangeParam = url.searchParams.get('range') ?? '30d';
	const range: RangePreset = isRangePreset(rangeParam) ? rangeParam : '30d';

	const scope = {
		siteId: site.id,
		range: resolveRange(range),
		timezone: site.timezone,
		filters: {}
	};

	let dashboard;
	try {
		dashboard = await getDashboard(scope);
	} catch (e) {
		console.error('[share] query failed', e);
		dashboard = {
			totals: EMPTY_TOTALS,
			previous: EMPTY_TOTALS,
			timeseries: [],
			breakdowns: { page: [], source: [], country: [], browser: [], os: [], device: [] }
		};
	}

	return { domain: site.domain, range, dashboard };
};
