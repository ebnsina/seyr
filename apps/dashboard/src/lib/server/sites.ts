import { and, eq } from 'drizzle-orm';
import { sites } from '@seyr/db/pg';
import { db } from './db';

export type Site = typeof sites.$inferSelect;

/** Normalize user-entered domain input to a bare host (no scheme, no www, no path). */
export function normalizeDomain(input: string): string {
	let d = input.trim().toLowerCase();
	d = d.replace(/^https?:\/\//, '').replace(/^www\./, '');
	d = d.split('/')[0]!.split(':')[0]!; // drop path + port
	return d;
}

const DOMAIN_RE = /^([a-z0-9](-?[a-z0-9])*\.)+[a-z]{2,}$/;

export function isValidDomain(domain: string): boolean {
	return DOMAIN_RE.test(domain) && domain.length <= 253;
}

/** All sites for an organization, newest first. */
export function getSitesForOrg(orgId: string): Promise<Site[]> {
	return db.select().from(sites).where(eq(sites.orgId, orgId)).orderBy(sites.createdAt);
}

/** A single site scoped to an org (returns null if it isn't theirs). */
export async function getSite(id: bigint, orgId: string): Promise<Site | null> {
	const rows = await db
		.select()
		.from(sites)
		.where(and(eq(sites.id, id), eq(sites.orgId, orgId)))
		.limit(1);
	return rows[0] ?? null;
}

/** Create a site for an org. Throws on duplicate domain (unique constraint). */
export async function createSite(orgId: string, domain: string, timezone = 'UTC'): Promise<Site> {
	const [site] = await db.insert(sites).values({ orgId, domain, timezone }).returning();
	return site!;
}

/** Delete a site, scoped to its org. */
export async function deleteSite(id: bigint, orgId: string): Promise<void> {
	await db.delete(sites).where(and(eq(sites.id, id), eq(sites.orgId, orgId)));
}
