import { z } from 'zod';
import { LIMITS } from './config.js';

/**
 * Wire format the tracker beacon sends. Keys are intentionally terse to keep the
 * payload tiny on the network — see `normalizeBeacon` for the readable shape.
 *
 *   n = event name        u = page URL (absolute)
 *   d = registered domain r = referrer (absolute)
 *   w = viewport width    m = custom props (string/number map)
 */
export const beaconSchema = z.object({
	n: z.string().trim().min(1).max(LIMITS.maxEventNameLength),
	u: z.string().trim().url().max(LIMITS.maxUrlLength),
	d: z.string().trim().min(1).max(253),
	r: z.string().trim().max(LIMITS.maxUrlLength).optional().default(''),
	w: z.number().int().positive().max(20000).optional(),
	m: z
		.record(z.string().max(LIMITS.maxPropKeyLength), z.union([z.string(), z.number(), z.boolean()]))
		.optional()
});

export type Beacon = z.infer<typeof beaconSchema>;

/** Custom-event properties flattened into the parallel arrays ClickHouse stores. */
export interface EventProps {
	keys: string[];
	values: string[];
}

/**
 * Normalize raw custom props into bounded, stringified parallel arrays.
 * Drops keys/values that exceed limits rather than rejecting the whole event.
 */
export function normalizeProps(meta: Beacon['m']): EventProps {
	const keys: string[] = [];
	const values: string[] = [];
	if (!meta) return { keys, values };

	for (const [key, raw] of Object.entries(meta)) {
		if (keys.length >= LIMITS.maxProps) break;
		const k = key.slice(0, LIMITS.maxPropKeyLength);
		const v = String(raw).slice(0, LIMITS.maxPropValueLength);
		if (k.length === 0) continue;
		keys.push(k);
		values.push(v);
	}
	return { keys, values };
}

/**
 * A fully-derived event row, ready to insert into ClickHouse. Produced by the
 * ingestor after geo/device derivation and visitor hashing. IP and raw UA are
 * intentionally absent — they are used transiently and never stored.
 */
export interface EventRow {
	site_id: bigint;
	timestamp: number; // unix seconds (UTC)
	name: string;
	visitor_id: bigint;
	session_id: bigint;
	hostname: string;
	pathname: string;
	referrer: string;
	referrer_source: string;
	utm_source: string;
	utm_medium: string;
	utm_campaign: string;
	country_code: string;
	region: string;
	city: string;
	browser: string;
	browser_version: string;
	os: string;
	os_version: string;
	device: string;
	prop_keys: string[];
	prop_values: string[];
}
