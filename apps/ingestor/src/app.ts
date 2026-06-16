import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { beaconSchema, INGEST_PATH } from '@seyr/shared';
import type { EventBuffer } from './lib/buffer.js';
import type { SiteResolver } from './lib/sites.js';
import type { SaltManager } from './lib/salt.js';
import { isBot } from './lib/bots.js';
import { buildEventRow } from './lib/pipeline.js';

export interface AppDeps {
	buffer: EventBuffer;
	sites: SiteResolver;
	salt: SaltManager;
}

export function createApp(deps: AppDeps): Hono {
	const app = new Hono();

	// Beacons come from arbitrary customer domains.
	app.use(INGEST_PATH, cors({ origin: '*', allowMethods: ['POST', 'OPTIONS'] }));

	app.get('/health', (c) => c.json({ ok: true, buffered: deps.buffer.size }));

	app.post(INGEST_PATH, async (c) => {
		const userAgent = c.req.header('user-agent') ?? '';

		// Cheap rejections first: bots never reach validation or the DB.
		if (isBot(userAgent)) return c.body(null, 202);

		// sendBeacon posts as text/plain, so parse the body manually.
		let raw: unknown;
		try {
			raw = JSON.parse(await c.req.text());
		} catch {
			return c.body(null, 202);
		}

		const parsed = beaconSchema.safeParse(raw);
		if (!parsed.success) return c.body(null, 202);

		const siteId = await deps.sites.resolve(parsed.data.d);
		if (siteId === null) return c.body(null, 202); // unregistered domain

		const row = buildEventRow(parsed.data, {
			headers: c.req.raw.headers,
			userAgent,
			salt: deps.salt.current(),
			siteId
		});
		deps.buffer.add(row);

		// Accept fast; the write happens asynchronously in the buffer.
		return c.body(null, 202);
	});

	return app;
}
