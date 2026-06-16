import type { Handle } from '@sveltejs/kit';
import {
	SESSION_COOKIE,
	deleteSessionCookie,
	setSessionCookie,
	validateSessionToken
} from '$lib/server/auth';

export const handle: Handle = async ({ event, resolve }) => {
	const token = event.cookies.get(SESSION_COOKIE);

	if (!token) {
		event.locals.user = null;
		event.locals.sessionId = null;
		return resolve(event);
	}

	const { user, sessionId } = await validateSessionToken(token);
	event.locals.user = user;
	event.locals.sessionId = sessionId;

	// Keep the cookie in lockstep with the session (renew or clear).
	if (user) {
		setSessionCookie(event.cookies, token);
	} else {
		deleteSessionCookie(event.cookies);
	}

	return resolve(event);
};
