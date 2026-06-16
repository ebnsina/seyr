import { error, json } from '@sveltejs/kit';
import { countEventsForSite } from '$lib/server/clickhouse';
import { getUserOrgs } from '$lib/server/orgs';
import { getSite } from '$lib/server/sites';
import type { RequestHandler } from './$types';

// Polled by the onboarding page to detect the first received event.
export const GET: RequestHandler = async ({ params, locals }) => {
	if (!locals.user) error(401);
	if (!/^\d+$/.test(params.id)) error(404);

	const orgs = await getUserOrgs(locals.user.id);
	const org = orgs[0];
	if (!org) error(404);

	const site = await getSite(BigInt(params.id), org.id);
	if (!site) error(404);

	let count = 0;
	try {
		count = await countEventsForSite(site.id);
	} catch {
		count = 0;
	}
	return json({ received: count > 0, count });
};
