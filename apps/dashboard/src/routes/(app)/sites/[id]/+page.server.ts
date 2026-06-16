import { error } from '@sveltejs/kit';
import { env } from '$env/dynamic/public';
import { countEventsForSite } from '$lib/server/clickhouse';
import { getSite } from '$lib/server/sites';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, parent }) => {
	const { currentOrg } = await parent();
	if (!currentOrg || !/^\d+$/.test(params.id)) error(404, 'Site not found');

	const site = await getSite(BigInt(params.id), currentOrg.id);
	if (!site) error(404, 'Site not found');

	const host = env.PUBLIC_INGEST_HOST ?? 'http://localhost:4000';

	let events = 0;
	try {
		events = await countEventsForSite(site.id);
	} catch {
		events = 0;
	}

	return {
		site: { id: site.id.toString(), domain: site.domain, timezone: site.timezone },
		scriptHost: host,
		events
	};
};
