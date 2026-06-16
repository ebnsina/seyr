/**
 * Cross-cutting constants shared by the tracker, ingestor, and dashboard.
 *
 * Naming note (ad-blocker evasion): public-facing paths and the script filename
 * deliberately avoid blocker-triggering words like `event`, `track`, `collect`,
 * `analytics`. The ingest path is a single neutral character so signature-based
 * filter rules have nothing obvious to match. Keep it config-driven — never
 * hardcode these strings elsewhere.
 */

/** Path the tracker POSTs beacons to (kept intentionally generic). */
export const INGEST_PATH = '/i';

/** Public filename customers embed (`<script src=".../seyr.js">`). */
export const SCRIPT_FILENAME = 'seyr.js';

/** Limits enforced on custom-event properties at ingest time. */
export const LIMITS = {
	/** Max custom props per event. */
	maxProps: 30,
	/** Max length of a prop key. */
	maxPropKeyLength: 100,
	/** Max length of a prop value (stringified). */
	maxPropValueLength: 2000,
	/** Max event name length. */
	maxEventNameLength: 120,
	/** Max URL / referrer length we store. */
	maxUrlLength: 2000
} as const;

/** Device buckets derived from the user agent. */
export const DEVICE_TYPES = ['desktop', 'mobile', 'tablet'] as const;
export type DeviceType = (typeof DEVICE_TYPES)[number];
