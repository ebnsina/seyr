import type { Database } from '@seyr/db/pg';
import { findSiteIdByDomain } from '@seyr/db/pg';

interface CacheEntry {
	siteId: bigint | null; // null = known-unregistered (negative cache)
	expires: number;
}

/**
 * Resolves a reported domain to its numeric site_id, with an in-memory TTL cache
 * so the hot path doesn't hit Postgres on every beacon. Negative results are
 * cached too, to cheaply shed traffic from unregistered domains.
 */
export class SiteResolver {
	private cache = new Map<string, CacheEntry>();

	constructor(
		private readonly db: Database,
		private readonly ttlMs = 60_000
	) {}

	async resolve(domain: string, now = Date.now()): Promise<bigint | null> {
		const cached = this.cache.get(domain);
		if (cached && cached.expires > now) return cached.siteId;

		const siteId = await findSiteIdByDomain(this.db, domain);
		this.cache.set(domain, { siteId, expires: now + this.ttlMs });
		return siteId;
	}
}
