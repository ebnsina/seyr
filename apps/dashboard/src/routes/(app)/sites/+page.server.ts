import { fail } from '@sveltejs/kit';
import { countEventsForSites } from '$lib/server/clickhouse';
import { getUserOrgs } from '$lib/server/orgs';
import {
	createSite,
	deleteSite,
	getSitesForOrg,
	isValidDomain,
	normalizeDomain
} from '$lib/server/sites';
import type { Actions, PageServerLoad } from './$types';

/** Resolve the acting user's current org inside an action (no `parent` there). */
async function currentOrgFor(userId: string) {
	const orgs = await getUserOrgs(userId);
	return orgs[0] ?? null;
}

export const load: PageServerLoad = async ({ parent }) => {
	const { currentOrg } = await parent();
	if (!currentOrg) return { sites: [] };

	const sites = await getSitesForOrg(currentOrg.id);

	// Best-effort: if ClickHouse is unavailable, show sites without live counts.
	let counts = new Map<string, number>();
	try {
		counts = await countEventsForSites(sites.map((s) => s.id));
	} catch {
		counts = new Map();
	}

	return {
		sites: sites.map((s) => ({
			id: s.id.toString(),
			domain: s.domain,
			timezone: s.timezone,
			events: counts.get(s.id.toString()) ?? 0
		}))
	};
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		if (!locals.user) return fail(401, { error: 'Not authenticated.' });
		const currentOrg = await currentOrgFor(locals.user.id);
		if (!currentOrg) return fail(400, { error: 'No organization.' });

		const data = await request.formData();
		const domain = normalizeDomain(String(data.get('domain') ?? ''));
		const timezone = String(data.get('timezone') ?? 'UTC');

		if (!isValidDomain(domain)) {
			return fail(400, { error: 'Enter a valid domain, e.g. example.com', domain });
		}

		try {
			await createSite(currentOrg.id, domain, timezone);
		} catch {
			return fail(400, { error: 'That domain is already being tracked.', domain });
		}
		return { created: domain };
	},

	delete: async ({ request, locals }) => {
		if (!locals.user) return fail(401, { error: 'Not authenticated.' });
		const currentOrg = await currentOrgFor(locals.user.id);
		if (!currentOrg) return fail(400, { error: 'No organization.' });

		const data = await request.formData();
		const id = String(data.get('id') ?? '');
		if (!/^\d+$/.test(id)) return fail(400, { error: 'Invalid site.' });

		await deleteSite(BigInt(id), currentOrg.id);
		return { deleted: true };
	}
};
