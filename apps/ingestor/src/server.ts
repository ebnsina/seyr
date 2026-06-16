import { createDb } from '@seyr/db/pg';
import { createClickHouse } from '@seyr/db/clickhouse';
import { loadConfig } from './config.js';
import { createApp } from './app.js';
import { EventBuffer } from './lib/buffer.js';
import { SiteResolver } from './lib/sites.js';
import { SaltManager } from './lib/salt.js';

const config = loadConfig();

const db = createDb(config.databaseUrl);
const ch = createClickHouse(config.clickhouse);

const buffer = new EventBuffer(ch, config.flushSize, config.flushIntervalMs);
buffer.start();

const app = createApp({
	buffer,
	sites: new SiteResolver(db),
	salt: new SaltManager(config.saltSecret)
});

const server = Bun.serve({ port: config.port, fetch: app.fetch });
console.log(`[ingestor] listening on http://localhost:${server.port}`);

// Drain the buffer before exiting so in-flight events aren't lost.
async function shutdown() {
	console.log('[ingestor] shutting down, flushing buffer…');
	await buffer.stop();
	await ch.close();
	process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
