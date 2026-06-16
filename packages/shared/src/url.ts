/**
 * Pure URL parsing helpers used by the ingestor to break a beacon's URL and
 * referrer into the columns we store. No PII, no network — just string work.
 */

export interface ParsedUrl {
	hostname: string;
	pathname: string;
	utm_source: string;
	utm_medium: string;
	utm_campaign: string;
}

/** Strip a trailing slash from a path (but keep the root "/"). */
function normalizePath(pathname: string): string {
	if (pathname.length > 1 && pathname.endsWith('/')) return pathname.slice(0, -1);
	return pathname || '/';
}

/** Parse an absolute page URL into stored components + UTM tags. */
export function parseUrl(raw: string): ParsedUrl {
	try {
		const url = new URL(raw);
		const q = url.searchParams;
		return {
			hostname: url.hostname.replace(/^www\./, ''),
			pathname: normalizePath(url.pathname),
			utm_source: q.get('utm_source')?.slice(0, 200) ?? '',
			utm_medium: q.get('utm_medium')?.slice(0, 200) ?? '',
			utm_campaign: q.get('utm_campaign')?.slice(0, 200) ?? ''
		};
	} catch {
		return { hostname: '', pathname: '/', utm_source: '', utm_medium: '', utm_campaign: '' };
	}
}

/**
 * Classify a referrer URL into a human-friendly source name (e.g. "Google",
 * "Twitter", "DuckDuckGo") or the bare hostname for anything unknown. Self
 * referrals (same site) and empty referrers collapse to "Direct".
 */
const KNOWN_SOURCES: Record<string, string> = {
	'google.': 'Google',
	'bing.': 'Bing',
	'duckduckgo.': 'DuckDuckGo',
	'yahoo.': 'Yahoo',
	'yandex.': 'Yandex',
	'baidu.': 'Baidu',
	't.co': 'Twitter',
	'twitter.': 'Twitter',
	'x.com': 'Twitter',
	'facebook.': 'Facebook',
	'instagram.': 'Instagram',
	'linkedin.': 'LinkedIn',
	'lnkd.in': 'LinkedIn',
	'reddit.': 'Reddit',
	'youtube.': 'YouTube',
	'github.': 'GitHub',
	'news.ycombinator.com': 'Hacker News',
	'producthunt.': 'Product Hunt'
};

export function classifyReferrer(referrer: string, currentHostname: string): string {
	if (!referrer) return 'Direct';
	let host: string;
	try {
		host = new URL(referrer).hostname.replace(/^www\./, '');
	} catch {
		return 'Direct';
	}
	if (!host || host === currentHostname.replace(/^www\./, '')) return 'Direct';

	for (const [needle, name] of Object.entries(KNOWN_SOURCES)) {
		if (host === needle || host.includes(needle)) return name;
	}
	return host;
}
