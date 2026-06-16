import type { PlanTier } from '@seyr/db/pg';

export interface Plan {
	tier: PlanTier;
	name: string;
	/** Monthly price in whole BDT (taka). */
	priceBdt: number;
	/** Included monthly events. */
	eventLimit: number;
	tagline: string;
	features: string[];
	popular?: boolean;
}

/** The public plan catalog. Prices in BDT for the Bangladesh market. */
export const PLANS: Plan[] = [
	{
		tier: 'free',
		name: 'Free',
		priceBdt: 0,
		eventLimit: 10_000,
		tagline: 'For personal sites and trying things out.',
		features: ['10k events / month', '1 site', '30-day retention', 'Cookieless tracking']
	},
	{
		tier: 'starter',
		name: 'Starter',
		priceBdt: 500,
		eventLimit: 100_000,
		tagline: 'For growing sites and side projects.',
		features: ['100k events / month', '5 sites', '1-year retention', 'Email support']
	},
	{
		tier: 'growth',
		name: 'Growth',
		priceBdt: 1500,
		eventLimit: 1_000_000,
		tagline: 'For businesses that live in their analytics.',
		features: ['1M events / month', 'Unlimited sites', '3-year retention', 'Priority support'],
		popular: true
	},
	{
		tier: 'business',
		name: 'Business',
		priceBdt: 5000,
		eventLimit: 10_000_000,
		tagline: 'For high-traffic sites and agencies.',
		features: ['10M events / month', 'Unlimited sites', '5-year retention', 'Dedicated support']
	}
];

export function getPlan(tier: PlanTier): Plan {
	return PLANS.find((p) => p.tier === tier) ?? PLANS[0]!;
}

/** Format a BDT amount for display, e.g. 1500 → "৳1,500". */
export function formatBdt(amount: number): string {
	return `৳${amount.toLocaleString('en-BD')}`;
}
