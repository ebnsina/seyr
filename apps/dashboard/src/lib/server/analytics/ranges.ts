import type { DateRange } from './filters';

export const RANGE_PRESETS = ['24h', '7d', '30d', '90d'] as const;
export type RangePreset = (typeof RANGE_PRESETS)[number];

export const RANGE_LABELS: Record<RangePreset, string> = {
	'24h': 'Last 24 hours',
	'7d': 'Last 7 days',
	'30d': 'Last 30 days',
	'90d': 'Last 90 days'
};

const SPANS_MS: Record<RangePreset, number> = {
	'24h': 1000 * 60 * 60 * 24,
	'7d': 1000 * 60 * 60 * 24 * 7,
	'30d': 1000 * 60 * 60 * 24 * 30,
	'90d': 1000 * 60 * 60 * 24 * 90
};

export function isRangePreset(v: string): v is RangePreset {
	return (RANGE_PRESETS as readonly string[]).includes(v);
}

/** Resolve a preset to a [from, to) window ending now. */
export function resolveRange(preset: RangePreset, now = Date.now()): DateRange {
	return { from: now - SPANS_MS[preset], to: now };
}

/** The equally-sized window immediately before `range` (for deltas). */
export function previousRange(range: DateRange): DateRange {
	const span = range.to - range.from;
	return { from: range.from - span, to: range.from };
}
