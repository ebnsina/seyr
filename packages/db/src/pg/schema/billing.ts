import { bigint, pgEnum, pgTable, primaryKey, text, uuid } from 'drizzle-orm/pg-core';
import { timestamps } from './_helpers';
import { organizations } from './orgs';

export const planTier = pgEnum('plan_tier', ['free', 'starter', 'growth', 'business']);

export const subscriptionStatus = pgEnum('subscription_status', [
	'trialing',
	'active',
	'past_due',
	'canceled',
	'incomplete'
]);

/** One row per org, mirrored from Stripe via webhooks. */
export const subscriptions = pgTable('subscriptions', {
	orgId: uuid('org_id')
		.primaryKey()
		.references(() => organizations.id, { onDelete: 'cascade' }),
	plan: planTier('plan').notNull().default('free'),
	status: subscriptionStatus('status').notNull().default('trialing'),
	/** Monthly included pageviews for the current plan (enforced at ingest). */
	monthlyEventLimit: bigint('monthly_event_limit', { mode: 'number' }).notNull().default(10_000),
	stripeCustomerId: text('stripe_customer_id').unique(),
	stripeSubscriptionId: text('stripe_subscription_id').unique(),
	stripePriceId: text('stripe_price_id'),
	currentPeriodEnd: text('current_period_end'),
	...timestamps
});

/**
 * Rolling monthly event counters per org, used for plan-limit enforcement.
 * `period` is the first day of the month, "YYYY-MM-01", in UTC.
 */
export const usage = pgTable(
	'usage',
	{
		orgId: uuid('org_id')
			.notNull()
			.references(() => organizations.id, { onDelete: 'cascade' }),
		period: text('period').notNull(),
		events: bigint('events', { mode: 'number' }).notNull().default(0),
		...timestamps
	},
	(t) => [primaryKey({ columns: [t.orgId, t.period] })]
);

export type Subscription = typeof subscriptions.$inferSelect;
export type PlanTier = (typeof planTier.enumValues)[number];

/** Default monthly event allowance per plan tier. */
export const PLAN_LIMITS: Record<PlanTier, number> = {
	free: 10_000,
	starter: 100_000,
	growth: 1_000_000,
	business: 10_000_000
};
