import { eq } from 'drizzle-orm';
import { payments, subscriptions, type Payment, type PlanTier } from '@seyr/db/pg';
import { db } from '../db';
import { getPlan } from '$lib/billing/plans';

const PERIOD_MS = 1000 * 60 * 60 * 24 * 30; // 30-day cycle

/** Create a pending payment (order) for a plan and return it with a fresh tran id. */
export async function createPayment(orgId: string, plan: PlanTier): Promise<Payment> {
	const tranId = `seyr_${crypto.randomUUID().replace(/-/g, '')}`;
	const amount = getPlan(plan).priceBdt;
	const [row] = await db
		.insert(payments)
		.values({ orgId, plan, amount, currency: 'BDT', tranId, status: 'pending' })
		.returning();
	return row!;
}

export async function getPaymentByTranId(tranId: string): Promise<Payment | null> {
	const rows = await db.select().from(payments).where(eq(payments.tranId, tranId)).limit(1);
	return rows[0] ?? null;
}

export async function markPayment(
	tranId: string,
	status: Payment['status'],
	valId?: string
): Promise<void> {
	await db.update(payments).set({ status, valId }).where(eq(payments.tranId, tranId));
}

/**
 * Activate (or extend) an org's subscription after a successful payment. If the
 * sub is already active and not yet expired, the new period stacks on top.
 */
export async function activateSubscription(
	orgId: string,
	plan: PlanTier,
	opts: { cardToken?: string } = {}
): Promise<void> {
	const limit = getPlan(plan).eventLimit;
	const autoRenew = Boolean(opts.cardToken);

	const existing = await db
		.select({ end: subscriptions.currentPeriodEnd, p: subscriptions.plan })
		.from(subscriptions)
		.where(eq(subscriptions.orgId, orgId))
		.limit(1);

	// Stack on remaining time only when staying on the same plan.
	const base =
		existing[0]?.end && existing[0].p === plan && existing[0].end.getTime() > Date.now()
			? existing[0].end.getTime()
			: Date.now();
	const periodEnd = new Date(base + PERIOD_MS);

	await db
		.insert(subscriptions)
		.values({
			orgId,
			plan,
			status: 'active',
			monthlyEventLimit: limit,
			currentPeriodEnd: periodEnd,
			autoRenew,
			cardToken: opts.cardToken ?? null,
			provider: 'sslcommerz'
		})
		.onConflictDoUpdate({
			target: subscriptions.orgId,
			set: {
				plan,
				status: 'active',
				monthlyEventLimit: limit,
				currentPeriodEnd: periodEnd,
				autoRenew,
				cardToken: opts.cardToken ?? null
			}
		});
}
