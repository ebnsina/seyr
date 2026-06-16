import { describe, expect, it } from 'vitest';
import { classifyReferrer, parseUrl } from './url.js';

describe('parseUrl', () => {
	it('extracts hostname, path, and utm tags', () => {
		const r = parseUrl('https://www.example.com/blog/post/?utm_source=twitter&utm_medium=social');
		expect(r.hostname).toBe('example.com');
		expect(r.pathname).toBe('/blog/post');
		expect(r.utm_source).toBe('twitter');
		expect(r.utm_medium).toBe('social');
	});

	it('keeps the root path', () => {
		expect(parseUrl('https://example.com/').pathname).toBe('/');
	});

	it('is safe on garbage input', () => {
		expect(parseUrl('not a url').pathname).toBe('/');
	});
});

describe('classifyReferrer', () => {
	it('maps known search/social hosts to friendly names', () => {
		expect(classifyReferrer('https://www.google.com/search?q=x', 'mysite.com')).toBe('Google');
		expect(classifyReferrer('https://t.co/abc', 'mysite.com')).toBe('Twitter');
		expect(classifyReferrer('https://news.ycombinator.com/', 'mysite.com')).toBe('Hacker News');
	});

	it('treats self-referrals and empties as Direct', () => {
		expect(classifyReferrer('', 'mysite.com')).toBe('Direct');
		expect(classifyReferrer('https://www.mysite.com/x', 'mysite.com')).toBe('Direct');
	});

	it('falls back to the bare hostname for unknown sources', () => {
		expect(classifyReferrer('https://blog.unknown.io/x', 'mysite.com')).toBe('blog.unknown.io');
	});
});
