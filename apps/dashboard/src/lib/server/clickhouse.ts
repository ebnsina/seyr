import { env } from '$env/dynamic/private';
import { createClickHouse, EVENTS_TABLE } from '@seyr/db/clickhouse';

/** Shared ClickHouse client for the dashboard's read queries. */
export const ch = createClickHouse({
	url: env.CLICKHOUSE_URL ?? 'http://localhost:8123',
	username: env.CLICKHOUSE_USER ?? 'seyr',
	password: env.CLICKHOUSE_PASSWORD ?? 'seyr',
	database: env.CLICKHOUSE_DB ?? 'seyr'
});

/** Total events recorded for a site — used by the install-verification check. */
export async function countEventsForSite(siteId: bigint): Promise<number> {
	const rs = await ch.query({
		query: `SELECT count() AS c FROM ${EVENTS_TABLE} WHERE site_id = {siteId:UInt64}`,
		query_params: { siteId: siteId.toString() },
		format: 'JSONEachRow'
	});
	const rows = (await rs.json()) as Array<{ c: string }>;
	return Number(rows[0]?.c ?? 0);
}

/** Event counts for many sites in one query → Map of site id → count. */
export async function countEventsForSites(siteIds: bigint[]): Promise<Map<string, number>> {
	const counts = new Map<string, number>();
	if (siteIds.length === 0) return counts;
	const rs = await ch.query({
		query: `SELECT site_id, count() AS c FROM ${EVENTS_TABLE}
			WHERE site_id IN {ids:Array(UInt64)} GROUP BY site_id`,
		query_params: { ids: siteIds.map((id) => id.toString()) },
		format: 'JSONEachRow'
	});
	for (const row of (await rs.json()) as Array<{ site_id: string; c: string }>) {
		counts.set(String(row.site_id), Number(row.c));
	}
	return counts;
}
