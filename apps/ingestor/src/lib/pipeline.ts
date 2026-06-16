import { classifyReferrer, normalizeProps, parseUrl, type Beacon, type EventRow } from '@seyr/shared';
import { hash64 } from './hash.js';
import { parseUserAgent } from './ua.js';
import { resolveGeo } from './geo.js';
import { clientIp } from './bots.js';

export interface RequestContext {
	headers: Headers;
	userAgent: string;
	salt: string;
	siteId: bigint;
	now?: Date;
}

/**
 * Turn a validated beacon + request into a ClickHouse-ready row. All PII (IP, raw
 * UA) is consumed here to derive the visitor hash, geo, and device — and then
 * dropped; none of it reaches the returned row.
 */
export function buildEventRow(beacon: Beacon, ctx: RequestContext): EventRow {
	const { hostname, pathname, utm_source, utm_medium, utm_campaign } = parseUrl(beacon.u);
	const ip = clientIp(ctx.headers);
	const device = parseUserAgent(ctx.userAgent);
	const geo = resolveGeo(ctx.headers);
	const props = normalizeProps(beacon.m);

	// Daily-rotating, non-durable visitor identity. Domain is included so the same
	// person on two tracked sites never shares a hash.
	const visitorId = hash64(`${ctx.salt}|${ip}|${ctx.userAgent}|${beacon.d}`);

	return {
		site_id: ctx.siteId,
		timestamp: Math.floor((ctx.now?.getTime() ?? Date.now()) / 1000),
		name: beacon.n,
		visitor_id: visitorId,
		// MVP: one session per visitor per day. Sessionization with a 30-min
		// inactivity window is a later refinement (see plan phase 6).
		session_id: visitorId,
		hostname,
		pathname,
		referrer: beacon.r ?? '',
		referrer_source: classifyReferrer(beacon.r ?? '', hostname),
		utm_source,
		utm_medium,
		utm_campaign,
		country_code: geo.country_code,
		region: geo.region,
		city: geo.city,
		browser: device.browser,
		browser_version: device.browser_version,
		os: device.os,
		os_version: device.os_version,
		device: device.device,
		prop_keys: props.keys,
		prop_values: props.values
	};
}
