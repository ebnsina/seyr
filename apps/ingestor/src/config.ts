/** Ingestor configuration, read once from the environment at startup. */
export interface IngestorConfig {
	port: number;
	saltSecret: string;
	databaseUrl: string;
	clickhouse: { url: string; username: string; password: string; database: string };
	/** Flush the event buffer when it reaches this many rows. */
	flushSize: number;
	/** …or after this many milliseconds, whichever comes first. */
	flushIntervalMs: number;
}

function required(name: string, fallback?: string): string {
	const v = process.env[name] ?? fallback;
	if (v === undefined) throw new Error(`Missing required env var: ${name}`);
	return v;
}

export function loadConfig(): IngestorConfig {
	return {
		port: Number(process.env.INGESTOR_PORT ?? 4000),
		saltSecret: required('INGEST_SALT_SECRET', 'dev-insecure-salt'),
		databaseUrl: required('DATABASE_URL', 'postgresql://seyr:seyr@localhost:5432/seyr'),
		clickhouse: {
			url: process.env.CLICKHOUSE_URL ?? 'http://localhost:8123',
			username: process.env.CLICKHOUSE_USER ?? 'seyr',
			password: process.env.CLICKHOUSE_PASSWORD ?? 'seyr',
			database: process.env.CLICKHOUSE_DB ?? 'seyr'
		},
		flushSize: Number(process.env.INGEST_FLUSH_SIZE ?? 1000),
		flushIntervalMs: Number(process.env.INGEST_FLUSH_INTERVAL_MS ?? 2000)
	};
}
