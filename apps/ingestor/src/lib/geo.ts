/**
 * Geo resolution. In production the ingestor runs behind a CDN/proxy (Cloudflare,
 * Vercel, Fastly) that already resolves the country from the client IP and passes
 * it as a header — so we read that and never touch the raw IP for geo.
 *
 * For finer region/city, plug in a MaxMind GeoLite2 reader here (gated on a
 * MAXMIND_DB_PATH env var); left out of the MVP to avoid the licensed .mmdb
 * download. The IP is used transiently for the visitor hash only, never stored.
 */

export interface GeoInfo {
	country_code: string; // ISO-3166 alpha-2, or '' if unknown
	region: string;
	city: string;
}

const COUNTRY_HEADERS = [
	'cf-ipcountry', // Cloudflare
	'x-vercel-ip-country', // Vercel
	'x-country-code',
	'fastly-geoip-countrycode'
];

export function resolveGeo(headers: Headers): GeoInfo {
	let country = '';
	for (const h of COUNTRY_HEADERS) {
		const v = headers.get(h);
		if (v && v.length === 2 && v !== 'XX') {
			country = v.toUpperCase();
			break;
		}
	}
	return {
		country_code: country,
		region: headers.get('x-vercel-ip-country-region') ?? '',
		city: headers.get('x-vercel-ip-city') ?? ''
	};
}
