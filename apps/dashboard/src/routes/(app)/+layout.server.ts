import { redirect } from '@sveltejs/kit';
import { getUserOrgs } from '$lib/server/orgs';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	if (!locals.user) redirect(302, '/login');

	const orgs = await getUserOrgs(locals.user.id);
	// Every account gets an org at signup, but guard anyway.
	const currentOrg = orgs[0] ?? null;

	return { user: locals.user, orgs, currentOrg };
};
