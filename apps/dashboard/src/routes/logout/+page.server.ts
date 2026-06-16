import { redirect } from '@sveltejs/kit';
import { deleteSessionCookie, invalidateSession } from '$lib/server/auth';
import type { Actions, PageServerLoad } from './$types';

// Direct GETs to /logout just bounce home.
export const load: PageServerLoad = () => redirect(302, '/');

export const actions: Actions = {
	default: async ({ locals, cookies }) => {
		if (locals.sessionId) await invalidateSession(locals.sessionId);
		deleteSessionCookie(cookies);
		redirect(302, '/login');
	}
};
