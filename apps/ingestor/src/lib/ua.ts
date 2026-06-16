import { UAParser } from 'ua-parser-js';
import type { DeviceType } from '@seyr/shared';

export interface DeviceInfo {
	browser: string;
	browser_version: string;
	os: string;
	os_version: string;
	device: DeviceType;
}

/** Map ua-parser's device type to our three buckets (desktop is the default). */
function deviceType(type: string | undefined): DeviceType {
	if (type === 'mobile') return 'mobile';
	if (type === 'tablet') return 'tablet';
	return 'desktop';
}

/** Parse a User-Agent string into stored device columns. UA itself is discarded. */
export function parseUserAgent(ua: string): DeviceInfo {
	const r = UAParser(ua);
	return {
		browser: r.browser.name ?? '',
		browser_version: (r.browser.version ?? '').split('.')[0] ?? '', // major only
		os: r.os.name ?? '',
		os_version: r.os.version ?? '',
		device: deviceType(r.device.type)
	};
}
