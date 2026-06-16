import { and, eq, isNotNull, lte, ne } from 'drizzle-orm';
import { subscriptions } from '@seyr/db/pg';
import { db } from '../db';
import { activateSubscription, createPayment, markPayment } from './orders';
import { getProvider } from './index';
import { getPlan } from '$lib/billing/plans';

/** Renew due subscriptions (auto-renew + tokenized card). Wallet users renew manually. */
export async function processDueRenewals(now = Date.now()): Promise<{
	attempted: number;
	renewed: number;
	failed: number;
}> {
	const provider = getProvider();
	const grace = new Date(now + 1000 * 60 * 60 * 24); // renew within 24h of expiry

	const due = await db
		.select()
		.from(subscriptions)
		.where(
			and(
				eq(subscriptions.autoRenew, true),
				isNotNull(subscriptions.cardToken),
				ne(subscriptions.plan, 'free'),
				lte(subscriptions.currentPeriodEnd, grace)
			)
		);

	let renewed = 0;
	let failed = 0;

	for (const sub of due) {
		const payment = await createPayment(sub.orgId, sub.plan);
		try {
			if (!provider.chargeToken) throw new Error('provider has no token charge');
			const { success } = await provider.chargeToken({
				tranId: payment.tranId,
				amount: payment.amount,
				currency: 'BDT',
				cardToken: sub.cardToken!,
				planName: `seyr ${getPlan(sub.plan).name}`
			});
			if (!success) throw new Error('charge declined');

			await markPayment(payment.tranId, 'success');
			await activateSubscription(sub.orgId, sub.plan, { cardToken: sub.cardToken! });
			renewed++;
		} catch (e) {
			console.error(`[renewals] ${sub.orgId} failed`, e);
			await markPayment(payment.tranId, 'failed');
			// Flag for follow-up; the manual renewal prompt takes over from here.
			await db
				.update(subscriptions)
				.set({ status: 'past_due' })
				.where(eq(subscriptions.orgId, sub.orgId));
			failed++;
		}
	}

	return { attempted: due.length, renewed, failed };
}
