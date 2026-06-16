import type { EventRow } from '@seyr/shared';
import type { ClickHouseClient } from './client';

export const EVENTS_TABLE = 'events';

/**
 * Insert a batch of event rows. Values are passed as JSONEachRow; bigint columns
 * are sent as strings (ClickHouse parses UInt64 from string safely, avoiding JS
 * number precision loss). Callers should batch — never insert one row per call.
 */
export async function insertEvents(ch: ClickHouseClient, rows: EventRow[]): Promise<void> {
	if (rows.length === 0) return;
	await ch.insert({
		table: EVENTS_TABLE,
		format: 'JSONEachRow',
		values: rows.map((r) => ({
			...r,
			site_id: r.site_id.toString(),
			visitor_id: r.visitor_id.toString(),
			session_id: r.session_id.toString()
		}))
	});
}
