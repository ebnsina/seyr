import { describe, expect, it } from 'vitest';
import { isRangePreset, previousRange, resolveRange } from './ranges';

describe('range presets', () => {
	it('validates known presets', () => {
		expect(isRangePreset('7d')).toBe(true);
		expect(isRangePreset('all-time')).toBe(false);
	});

	it('resolves a preset to a window ending at now', () => {
		const now = Date.UTC(2026, 5, 16, 12, 0, 0);
		const r = resolveRange('7d', now);
		expect(r.to).toBe(now);
		expect(r.to - r.from).toBe(7 * 24 * 60 * 60 * 1000);
	});

	it('previousRange is the equal window immediately before', () => {
		const r = { from: 1000, to: 2000 };
		const prev = previousRange(r);
		expect(prev).toEqual({ from: 0, to: 1000 });
	});
});
