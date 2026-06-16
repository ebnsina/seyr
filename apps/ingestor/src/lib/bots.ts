import { isbot } from 'isbot';

/** True if the request looks like a bot/crawler and should not be counted. */
export function isBot(userAgent: string | null): boolean {
	if (!userAgent) return true; // no UA → almost always automation
	return isbot(userAgent);
}

/** Extract the client IP from common proxy headers (transient; never stored). */
export function clientIp(headers: Headers): string {
	const fwd = headers.get('x-forwarded-for');
	if (fwd) return fwd.split(',')[0]!.trim();
	return (
		headers.get('cf-connecting-ip') ?? headers.get('x-real-ip') ?? '0.0.0.0'
	);
}
