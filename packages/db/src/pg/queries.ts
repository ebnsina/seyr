import { eq } from 'drizzle-orm';
import type { Database } from './client';
import { sites } from './schema/index';

/** Look up a site's numeric id by its bare domain, or null if not registered. */
export async function findSiteIdByDomain(db: Database, domain: string): Promise<bigint | null> {
	const rows = await db.select({ id: sites.id }).from(sites).where(eq(sites.domain, domain)).limit(1);
	return rows[0]?.id ?? null;
}
