import { eq } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import { subscriptions } from '@seyr/db/pg';
import { db } from '$lib/server/db';
import { getMonthToDateUsage, getSubscription } from '$lib/server/billing';
import { getUserOrgs } from '$lib/server/orgs';
import { getPlan } from '$lib/billing/plans';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent }) => {
	const { currentOrg } = await parent();
	if (!currentOrg) return { subscription: null, usage: 0, planName: 'Free', limit: 10_000 };

	const subscription = await getSubscription(currentOrg.id);
	const usage = await getMonthToDateUsage(currentOrg.id);
	const plan = getPlan(subscription.plan);

	return {
		subscription: {
			plan: subscription.plan,
			status: subscription.status,
			autoRenew: subscription.autoRenew,
			currentPeriodEnd: subscription.currentPeriodEnd?.toISOString() ?? null
		},
		planName: plan.name,
		limit: subscription.monthlyEventLimit,
		usage
	};
};

export const actions: Actions = {
	autoRenew: async ({ request, locals }) => {
		if (!locals.user) return fail(401);
		const org = (await getUserOrgs(locals.user.id))[0];
		if (!org) return fail(400);

		const enabled = (await request.formData()).get('enabled') === 'true';
		await db
			.update(subscriptions)
			.set({ autoRenew: enabled })
			.where(eq(subscriptions.orgId, org.id));
		return { autoRenewSet: enabled };
	}
};
