import { describe, expect, it } from 'vitest';
import { isValidDomain, normalizeDomain } from './sites';

describe('normalizeDomain', () => {
	it('strips scheme, www, path, port and lowercases', () => {
		expect(normalizeDomain('HTTPS://www.Example.com/path?x=1')).toBe('example.com');
		expect(normalizeDomain('http://Sub.Example.co.uk:8080/')).toBe('sub.example.co.uk');
		expect(normalizeDomain('  Example.com  ')).toBe('example.com');
	});
});

describe('isValidDomain', () => {
	it('accepts real domains', () => {
		for (const d of ['example.com', 'sub.example.co.uk', 'my-site.io']) {
			expect(isValidDomain(d)).toBe(true);
		}
	});
	it('rejects junk', () => {
		for (const d of ['', 'localhost', 'no-tld', 'has space.com', 'http://x.com']) {
			expect(isValidDomain(d)).toBe(false);
		}
	});
});
