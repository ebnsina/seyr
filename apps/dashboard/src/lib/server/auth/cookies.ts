import type { Cookies } from '@sveltejs/kit';
import { SESSION_COOKIE, sessionTtlMs } from './session';

/** Set the session cookie (httpOnly, lax, secure in prod). */
export function setSessionCookie(cookies: Cookies, token: string): void {
	cookies.set(SESSION_COOKIE, token, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: process.env.NODE_ENV === 'production',
		maxAge: Math.floor(sessionTtlMs / 1000)
	});
}

/** Clear the session cookie (logout). */
export function deleteSessionCookie(cookies: Cookies): void {
	cookies.delete(SESSION_COOKIE, { path: '/' });
}
