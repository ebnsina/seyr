import { describe, expect, it } from 'vitest';
import { PLANS, formatBdt, getPlan } from './plans';

describe('plans', () => {
	it('has exactly one popular plan and ascending prices', () => {
		expect(PLANS.filter((p) => p.popular)).toHaveLength(1);
		const prices = PLANS.map((p) => p.priceBdt);
		expect(prices).toEqual([...prices].sort((a, b) => a - b));
	});

	it('getPlan returns the plan, falling back to free', () => {
		expect(getPlan('growth').name).toBe('Growth');
		// @ts-expect-error — exercising the fallback path
		expect(getPlan('nope').tier).toBe('free');
	});

	it('formats BDT with the taka sign', () => {
		expect(formatBdt(1500)).toBe('৳1,500');
	});

	it('event limits increase with price', () => {
		for (let i = 1; i < PLANS.length; i++) {
			expect(PLANS[i].eventLimit).toBeGreaterThan(PLANS[i - 1].eventLimit);
		}
	});
});
