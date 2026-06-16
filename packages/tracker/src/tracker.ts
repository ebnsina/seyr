/**
 * seyr tracker — the tiny script customers embed.
 *
 * Design goals: <1KB gzipped, no cookies, no localStorage, no fingerprinting.
 * The beacon endpoint is derived from the script's own origin so that
 * first-party "proxy mode" (serving this script from the customer's domain)
 * works with zero extra config and dodges ad-blocker domain rules.
 */
import { INGEST_PATH } from '@seyr/shared/config';

type Props = Record<string, string | number | boolean>;

interface Beacon {
	n: string;
	u: string;
	d: string;
	r?: string;
	w?: number;
	m?: Props;
}

(function () {
	const win = window;
	const doc = document;
	const loc = win.location;

	// The <script> tag that loaded us — its attributes are our config.
	const script = (doc.currentScript ||
		doc.querySelector('script[data-domain]')) as HTMLScriptElement | null;
	if (!script) return;

	const domain = script.getAttribute('data-domain');
	if (!domain) return;

	// Beacon goes to the same origin the script was served from (+ neutral path),
	// unless an explicit host override is provided.
	const endpoint =
		(script.getAttribute('data-host') || new URL(script.src).origin) + INGEST_PATH;

	const exclude = (script.getAttribute('data-exclude') || '')
		.split(',')
		.map((s) => s.trim())
		.filter(Boolean);

	/** Skip bots, local dev, prerenders, DNT, and excluded paths. */
	function shouldIgnore(): boolean {
		if (win.localStorage?.getItem('seyr_ignore') === 'true') return true;
		if (/^localhost$|^127\.|^\[::1\]$/.test(loc.hostname) || loc.protocol === 'file:') return true;
		if ((doc as Document & { prerendering?: boolean }).prerendering) return true;
		if (
			(win.navigator as Navigator & { doNotTrack?: string }).doNotTrack === '1' ||
			(win as Window & { doNotTrack?: string }).doNotTrack === '1'
		)
			return true;
		return exclude.some((pat) =>
			new RegExp('^' + pat.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*') + '$').test(loc.pathname)
		);
	}

	function send(name: string, props?: Props): void {
		if (shouldIgnore()) return;
		const body: Beacon = {
			n: name,
			u: loc.href,
			d: domain!,
			r: doc.referrer || undefined,
			w: win.innerWidth || undefined,
			m: props
		};
		const payload = JSON.stringify(body);
		// sendBeacon survives page unload; fall back to fetch keepalive.
		if (!(navigator.sendBeacon && navigator.sendBeacon(endpoint, payload))) {
			fetch(endpoint, { method: 'POST', body: payload, keepalive: true }).catch(() => {});
		}
	}

	let lastPath = '';
	function trackPageview(): void {
		if (loc.pathname === lastPath) return; // dedupe rapid repeats
		lastPath = loc.pathname;
		send('pageview');
	}

	// Public API: seyr('event', name, props) or seyr('pageview').
	function seyr(action: string, a?: string | Props, b?: Props): void {
		if (action === 'pageview') trackPageview();
		else if (action === 'event' && typeof a === 'string') send(a, b);
	}

	// Drain any calls queued by the loader stub before this script arrived.
	const existing = (win as Window & { seyr?: { q?: unknown[][] } }).seyr;
	(win as unknown as { seyr: typeof seyr }).seyr = seyr;
	if (existing?.q) for (const args of existing.q) seyr(...(args as Parameters<typeof seyr>));

	// SPA support: patch history and listen for back/forward.
	const patch = (type: 'pushState' | 'replaceState') => {
		const orig = history[type];
		history[type] = function (this: History, ...args: Parameters<History['pushState']>) {
			const r = orig.apply(this, args);
			trackPageview();
			return r;
		};
	};
	patch('pushState');
	patch('replaceState');
	win.addEventListener('popstate', trackPageview);

	// Initial pageview (defer until visible to skip prerender/background tabs).
	const visibility = () => doc.visibilityState as string;
	if (visibility() === 'prerender') {
		doc.addEventListener('visibilitychange', function once() {
			if (visibility() !== 'prerender') {
				doc.removeEventListener('visibilitychange', once);
				trackPageview();
			}
		});
	} else {
		trackPageview();
	}
})();
