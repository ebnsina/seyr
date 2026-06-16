import { error, fail } from '@sveltejs/kit';
import { env } from '$env/dynamic/public';
import { countEventsForSite } from '$lib/server/clickhouse';
import { getUserOrgs } from '$lib/server/orgs';
import { getSite, regenerateShareToken, setSitePublic } from '$lib/server/sites';
import type { Actions, PageServerLoad } from './$types';

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
		site: {
			id: site.id.toString(),
			domain: site.domain,
			timezone: site.timezone,
			isPublic: site.isPublic,
			shareToken: site.shareToken
		},
		scriptHost: host,
		events
	};
};

async function ownedSiteId(userId: string, idParam: string): Promise<bigint | null> {
	if (!/^\d+$/.test(idParam)) return null;
	const org = (await getUserOrgs(userId))[0];
	if (!org) return null;
	const site = await getSite(BigInt(idParam), org.id);
	return site ? site.id : null;
}

export const actions: Actions = {
	togglePublic: async ({ params, request, locals }) => {
		if (!locals.user) return fail(401);
		const org = (await getUserOrgs(locals.user.id))[0];
		if (!org) return fail(400);
		const id = await ownedSiteId(locals.user.id, params.id);
		if (id === null) return fail(404);

		const enabled = (await request.formData()).get('enabled') === 'true';
		await setSitePublic(id, org.id, enabled);
		return { isPublic: enabled };
	},

	regenerateShare: async ({ params, locals }) => {
		if (!locals.user) return fail(401);
		const org = (await getUserOrgs(locals.user.id))[0];
		if (!org) return fail(400);
		const id = await ownedSiteId(locals.user.id, params.id);
		if (id === null) return fail(404);

		await regenerateShareToken(id, org.id);
		return { regenerated: true };
	}
};
