import { eq } from 'drizzle-orm';
import { sites, subscriptions, type Subscription } from '@seyr/db/pg';
import { db } from './db';
import { countEventsSince } from './clickhouse';

/** The current subscription for an org, or a synthesized free default. */
export async function getSubscription(orgId: string): Promise<Subscription> {
	const rows = await db.select().from(subscriptions).where(eq(subscriptions.orgId, orgId)).limit(1);
	if (rows[0]) return rows[0];
	const now = new Date();
	return {
		orgId,
		plan: 'free',
		status: 'active',
		monthlyEventLimit: 10_000,
		currentPeriodEnd: null,
		autoRenew: false,
		provider: 'sslcommerz',
		cardToken: null,
		createdAt: now,
		updatedAt: now
	};
}

function startOfMonthUTC(now = new Date()): number {
	return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1);
}

/** Month-to-date event count across all of an org's sites (from ClickHouse). */
export async function getMonthToDateUsage(orgId: string): Promise<number> {
	const orgSites = await db.select({ id: sites.id }).from(sites).where(eq(sites.orgId, orgId));
	if (orgSites.length === 0) return 0;
	try {
		return await countEventsSince(
			orgSites.map((s) => s.id),
			startOfMonthUTC()
		);
	} catch {
		return 0;
	}
}
