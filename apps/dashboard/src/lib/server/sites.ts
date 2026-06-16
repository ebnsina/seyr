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

function generateShareToken(): string {
	const bytes = new Uint8Array(16);
	crypto.getRandomValues(bytes);
	return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Toggle a site's public dashboard. Enabling mints a share token (if missing);
 * disabling keeps the token but flips the flag off so the link stops working.
 */
export async function setSitePublic(id: bigint, orgId: string, isPublic: boolean): Promise<void> {
	const site = await getSite(id, orgId);
	if (!site) return;
	const shareToken = isPublic ? (site.shareToken ?? generateShareToken()) : site.shareToken;
	await db
		.update(sites)
		.set({ isPublic, shareToken })
		.where(and(eq(sites.id, id), eq(sites.orgId, orgId)));
}

/** Rotate the share token, invalidating any previously shared link. */
export async function regenerateShareToken(id: bigint, orgId: string): Promise<void> {
	await db
		.update(sites)
		.set({ shareToken: generateShareToken() })
		.where(and(eq(sites.id, id), eq(sites.orgId, orgId)));
}

/** Resolve a site by its share token — only if its public dashboard is enabled. */
export async function getPublicSiteByToken(token: string): Promise<Site | null> {
	const rows = await db
		.select()
		.from(sites)
		.where(and(eq(sites.shareToken, token), eq(sites.isPublic, true)))
		.limit(1);
	return rows[0] ?? null;
}
