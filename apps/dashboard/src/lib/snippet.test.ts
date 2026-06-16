import { describe, expect, it } from 'vitest';
import { buildSnippet } from './snippet';

describe('buildSnippet', () => {
	it('embeds the domain and points src at the script host', () => {
		const s = buildSnippet('https://cdn.seyr.app', 'example.com');
		expect(s).toContain('data-domain="example.com"');
		expect(s).toContain('src="https://cdn.seyr.app/seyr.js"');
		expect(s).toContain('defer');
	});
});
