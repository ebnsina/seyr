import {
	bigint,
	boolean,
	integer,
	pgEnum,
	pgTable,
	primaryKey,
	text,
	timestamp,
	uuid
} from 'drizzle-orm/pg-core';
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

export const paymentStatus = pgEnum('payment_status', [
	'pending',
	'success',
	'failed',
	'cancelled'
]);

/**
 * One row per org. Provider-agnostic so the payment gateway (SSLCommerz today)
 * can change without a schema migration. `cardToken` is set when the customer
 * paid by card and opted into tokenized auto-renewal; wallet users renew manually.
 */
export const subscriptions = pgTable('subscriptions', {
	orgId: uuid('org_id')
		.primaryKey()
		.references(() => organizations.id, { onDelete: 'cascade' }),
	plan: planTier('plan').notNull().default('free'),
	status: subscriptionStatus('status').notNull().default('trialing'),
	/** Monthly included pageviews for the current plan (enforced at ingest). */
	monthlyEventLimit: bigint('monthly_event_limit', { mode: 'number' }).notNull().default(10_000),
	/** When the current paid period ends (null on free). */
	currentPeriodEnd: timestamp('current_period_end', { withTimezone: true }),
	autoRenew: boolean('auto_renew').notNull().default(false),
	provider: text('provider').notNull().default('sslcommerz'),
	/** Tokenized card reference for auto-renew (null for wallet/manual). */
	cardToken: text('card_token'),
	...timestamps
});

/** A single payment attempt against the gateway (the order/transaction record). */
export const payments = pgTable('payments', {
	id: uuid('id').primaryKey().defaultRandom(),
	orgId: uuid('org_id')
		.notNull()
		.references(() => organizations.id, { onDelete: 'cascade' }),
	plan: planTier('plan').notNull(),
	/** Whole-taka amount (BDT). */
	amount: integer('amount').notNull(),
	currency: text('currency').notNull().default('BDT'),
	/** Our unique transaction id sent to the gateway. */
	tranId: text('tran_id').notNull().unique(),
	status: paymentStatus('status').notNull().default('pending'),
	provider: text('provider').notNull().default('sslcommerz'),
	/** Gateway validation id returned on success. */
	valId: text('val_id'),
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
export type Payment = typeof payments.$inferSelect;
export type PlanTier = (typeof planTier.enumValues)[number];
export type PaymentStatus = (typeof paymentStatus.enumValues)[number];

/** Default monthly event allowance per plan tier. */
export const PLAN_LIMITS: Record<PlanTier, number> = {
	free: 10_000,
	starter: 100_000,
	growth: 1_000_000,
	business: 10_000_000
};
