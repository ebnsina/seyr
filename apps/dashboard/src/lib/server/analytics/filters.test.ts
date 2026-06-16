import { describe, expect, it } from 'vitest';
import { buildWhere, type QueryScope } from './filters';

const base: QueryScope = {
	siteId: 7n,
	range: { from: Date.UTC(2026, 0, 1), to: Date.UTC(2026, 0, 31) },
	timezone: 'UTC',
	filters: {}
};

describe('buildWhere', () => {
	it('always scopes by site and time window', () => {
		const { clause, params } = buildWhere(base);
		expect(clause).toContain('site_id = {siteId:UInt64}');
		expect(clause).toContain('timestamp >= parseDateTimeBestEffort({from:String})');
		expect(clause).toContain('timestamp < parseDateTimeBestEffort({to:String})');
		expect(params.siteId).toBe('7');
		expect(params.from).toBe('2026-01-01 00:00:00');
	});

	it('maps filters to whitelisted columns as bound params', () => {
		const { clause, params } = buildWhere({
			...base,
			filters: { source: 'Google', country: 'US' }
		});
		expect(clause).toContain('referrer_source = {f_source:String}');
		expect(clause).toContain('country_code = {f_country:String}');
		expect(params.f_source).toBe('Google');
		expect(params.f_country).toBe('US');
	});

	it('never interpolates filter values into SQL (injection safe)', () => {
		const evil = "x'; DROP TABLE events; --";
		const { clause, params } = buildWhere({ ...base, filters: { page: evil } });
		// The value is a bound parameter, not part of the SQL text.
		expect(clause).not.toContain('DROP');
		expect(clause).toContain('pathname = {f_page:String}');
		expect(params.f_page).toBe(evil);
	});

	it('ignores empty filter values', () => {
		const { clause } = buildWhere({ ...base, filters: { source: '' } });
		expect(clause).not.toContain('referrer_source');
	});
});
