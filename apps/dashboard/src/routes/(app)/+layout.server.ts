import { redirect } from '@sveltejs/kit';
import { getMonthToDateUsage, getSubscription } from '$lib/server/billing';
import { getUserOrgs } from '$lib/server/orgs';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	if (!locals.user) redirect(302, '/login');

	const orgs = await getUserOrgs(locals.user.id);
	// Every account gets an org at signup, but guard anyway.
	const currentOrg = orgs[0] ?? null;

	// Lightweight usage check to drive an app-wide upgrade banner.
	let usageRatio = 0;
	if (currentOrg) {
		const [sub, usage] = await Promise.all([
			getSubscription(currentOrg.id),
			getMonthToDateUsage(currentOrg.id)
		]);
		usageRatio = sub.monthlyEventLimit > 0 ? usage / sub.monthlyEventLimit : 0;
	}

	return { user: locals.user, orgs, currentOrg, usageRatio };
};
