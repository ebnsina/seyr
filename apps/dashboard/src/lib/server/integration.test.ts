/**
 * Integration tests for the security-critical server paths (auth, org-scoping,
 * billing finalization, public-dashboard access). These hit a real Postgres and
 * self-skip when one isn't reachable, so the default `pnpm test` stays green
 * without infra. To run them: `pnpm infra:up` and export DATABASE_URL, then
 * `pnpm test`.
 */
import { afterAll, describe, expect, it } from 'vitest';
import { eq, sql } from 'drizzle-orm';
import { organizations } from '@seyr/db/pg';
import { db } from './db';
import {
	createAccount,
	createSession,
	findUserByEmail,
	generateSessionToken,
	invalidateSession,
	validateSessionToken,
	verifyPassword
} from './auth';
import { getUserOrgs } from './orgs';
import {
	createSite,
	getPublicSiteByToken,
	getSite,
	regenerateShareToken,
	setSitePublic
} from './sites';
import { getSubscription } from './billing';
import { createPayment } from './payments';
import { finalizePayment } from './payments/finalize';

async function dbReachable(): Promise<boolean> {
	try {
		await db.execute(sql`select 1`);
		return true;
	} catch {
		return false;
	}
}

const dbUp = await dbReachable();
if (!dbUp) console.warn('[integration] Postgres unreachable — skipping integration tests');

const rand = () => Math.random().toString(36).slice(2, 10);

describe.skipIf(!dbUp)('integration', () => {
	const createdOrgIds: string[] = [];

	async function newAccount() {
		const email = `test_${rand()}@example.com`;
		const userId = await createAccount({ email, password: 'supersecret123', name: 'Test' });
		const org = (await getUserOrgs(userId))[0]!;
		createdOrgIds.push(org.id);
		return { userId, email, orgId: org.id };
	}

	afterAll(async () => {
		for (const id of createdOrgIds) {
			await db.delete(organizations).where(eq(organizations.id, id));
		}
	});

	it('signup creates a user with an owner membership', async () => {
		const { userId, email, orgId } = await newAccount();
		expect(userId).toBeTruthy();
		const orgs = await getUserOrgs(userId);
		expect(orgs).toHaveLength(1);
		expect(orgs[0]!.role).toBe('owner');
		expect(orgs[0]!.id).toBe(orgId);
		expect((await findUserByEmail(email))?.id).toBe(userId);
	});

	it('password verification accepts the right password and rejects others', async () => {
		const { email } = await newAccount();
		const user = await findUserByEmail(email);
		expect(await verifyPassword(user!.passwordHash!, 'supersecret123')).toBe(true);
		expect(await verifyPassword(user!.passwordHash!, 'wrong')).toBe(false);
	});

	it('session lifecycle: create -> validate -> invalidate', async () => {
		const { userId } = await newAccount();
		const token = generateSessionToken();
		const { id } = await createSession(token, userId);

		const valid = await validateSessionToken(token);
		expect(valid.user?.id).toBe(userId);

		await invalidateSession(id);
		const after = await validateSessionToken(token);
		expect(after.user).toBeNull();
	});

	it('sites are org-scoped: another org cannot read them', async () => {
		const a = await newAccount();
		const b = await newAccount();
		const site = await createSite(a.orgId, `a-${rand()}.com`);

		expect((await getSite(site.id, a.orgId))?.id).toBe(site.id);
		expect(await getSite(site.id, b.orgId)).toBeNull();
	});

	it('public dashboard: token only resolves while public, and rotates', async () => {
		const a = await newAccount();
		const site = await createSite(a.orgId, `pub-${rand()}.com`);

		await setSitePublic(site.id, a.orgId, true);
		const token = (await getSite(site.id, a.orgId))!.shareToken!;
		expect((await getPublicSiteByToken(token))?.id).toBe(site.id);

		await setSitePublic(site.id, a.orgId, false);
		expect(await getPublicSiteByToken(token)).toBeNull();

		await setSitePublic(site.id, a.orgId, true);
		await regenerateShareToken(site.id, a.orgId);
		const newToken = (await getSite(site.id, a.orgId))!.shareToken!;
		expect(newToken).not.toBe(token);
		expect(await getPublicSiteByToken(token)).toBeNull();
		expect((await getPublicSiteByToken(newToken))?.id).toBe(site.id);
	});

	it('billing: payment finalization activates the plan and is idempotent', async () => {
		const a = await newAccount();
		const payment = await createPayment(a.orgId, 'growth');

		const ok = await finalizePayment(payment.tranId, `mock_${payment.tranId}`);
		expect(ok).toBe(true);

		const sub = await getSubscription(a.orgId);
		expect(sub.plan).toBe('growth');
		expect(sub.status).toBe('active');
		const firstEnd = sub.currentPeriodEnd?.getTime();

		// Replaying must not extend the period again.
		await finalizePayment(payment.tranId, `mock_${payment.tranId}`);
		const sub2 = await getSubscription(a.orgId);
		expect(sub2.currentPeriodEnd?.getTime()).toBe(firstEnd);
	});
});
