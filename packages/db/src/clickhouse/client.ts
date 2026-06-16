import { createClient, type ClickHouseClient } from '@clickhouse/client';

export type { ClickHouseClient };

export interface ClickHouseConfig {
	url: string;
	username: string;
	password: string;
	database: string;
}

/** Create a ClickHouse client. Reuse a single instance per process. */
export function createClickHouse(config: ClickHouseConfig): ClickHouseClient {
	return createClient({
		url: config.url,
		username: config.username,
		password: config.password,
		database: config.database,
		// Server-side batching: lets us send many small inserts that ClickHouse
		// coalesces, complementing the ingestor's in-memory buffer.
		clickhouse_settings: {
			async_insert: 1,
			wait_for_async_insert: 0
		}
	});
}

/** Build a ClickHouseConfig from process env (shared by ingestor + dashboard). */
export function clickHouseConfigFromEnv(env: NodeJS.ProcessEnv = process.env): ClickHouseConfig {
	return {
		url: env.CLICKHOUSE_URL ?? 'http://localhost:8123',
		username: env.CLICKHOUSE_USER ?? 'seyr',
		password: env.CLICKHOUSE_PASSWORD ?? 'seyr',
		database: env.CLICKHOUSE_DB ?? 'seyr'
	};
}
