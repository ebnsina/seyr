import { describe, expect, it } from 'bun:test';
import { buildEventRow, type RequestContext } from './pipeline.js';
import type { Beacon } from '@seyr/shared';

const beacon: Beacon = {
	n: 'pageview',
	u: 'https://example.com/pricing?utm_source=hn',
	d: 'example.com',
	r: 'https://news.ycombinator.com/'
};

function ctx(overrides: Partial<RequestContext> = {}): RequestContext {
	return {
		headers: new Headers({ 'x-forwarded-for': '203.0.113.7', 'cf-ipcountry': 'DE' }),
		userAgent:
			'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36',
		salt: 'salt-day-1',
		siteId: 42n,
		...overrides
	};
}

describe('buildEventRow', () => {
	it('derives page, referrer, utm, geo, and device columns', () => {
		const row = buildEventRow(beacon, ctx());
		expect(row.site_id).toBe(42n);
		expect(row.hostname).toBe('example.com');
		expect(row.pathname).toBe('/pricing');
		expect(row.referrer_source).toBe('Hacker News');
		expect(row.utm_source).toBe('hn');
		expect(row.country_code).toBe('DE');
		expect(row.browser).toBe('Chrome');
		expect(row.device).toBe('desktop');
	});

	it('stores no PII — IP and raw UA never appear on the row', () => {
		const row = buildEventRow(beacon, ctx());
		const serialized = JSON.stringify(row, (_k, v) => (typeof v === 'bigint' ? v.toString() : v));
		expect(serialized).not.toContain('203.0.113.7');
		expect(serialized).not.toContain('Mozilla');
	});

	it('produces a stable visitor hash within a day, different across salts', () => {
		const a = buildEventRow(beacon, ctx({ salt: 'day-1' }));
		const b = buildEventRow(beacon, ctx({ salt: 'day-1' }));
		const c = buildEventRow(beacon, ctx({ salt: 'day-2' }));
		expect(a.visitor_id).toBe(b.visitor_id);
		expect(a.visitor_id).not.toBe(c.visitor_id);
	});
});
