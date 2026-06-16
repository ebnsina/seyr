import { error, redirect } from '@sveltejs/kit';
import { getUserOrgs } from '$lib/server/orgs';
import { createPayment, getProvider } from '$lib/server/payments';
import { getPlan } from '$lib/billing/plans';
import type { PlanTier } from '@seyr/db/pg';
import type { Actions, PageServerLoad } from './$types';

// No standalone page — only the action.
export const load: PageServerLoad = () => redirect(302, '/billing');

const PAID_TIERS: PlanTier[] = ['starter', 'growth', 'business'];

export const actions: Actions = {
	default: async ({ request, locals, url }) => {
		if (!locals.user) redirect(302, '/login');
		const org = (await getUserOrgs(locals.user.id))[0];
		if (!org) error(400, 'No organization');

		const data = await request.formData();
		const plan = String(data.get('plan') ?? '') as PlanTier;
		if (!PAID_TIERS.includes(plan)) error(400, 'Invalid plan');

		const payment = await createPayment(org.id, plan);
		const base = url.origin;

		const { redirectUrl } = await getProvider().initiate({
			tranId: payment.tranId,
			amount: payment.amount,
			currency: 'BDT',
			planName: `seyr ${getPlan(plan).name}`,
			customerName: locals.user.name ?? 'Customer',
			customerEmail: locals.user.email,
			successUrl: `${base}/billing/callback/success`,
			failUrl: `${base}/billing/callback/fail`,
			cancelUrl: `${base}/billing/callback/cancel`,
			ipnUrl: `${base}/billing/ipn`
		});

		redirect(303, redirectUrl);
	}
};
