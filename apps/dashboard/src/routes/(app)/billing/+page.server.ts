import { getMonthToDateUsage, getSubscription } from '$lib/server/billing';
import { getPlan } from '$lib/billing/plans';
import type { PageServerLoad } from './$types';

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
