import { fail, redirect } from '@sveltejs/kit';
import {
	createAccount,
	createSession,
	findUserByEmail,
	generateSessionToken,
	setSessionCookie
} from '$lib/server/auth';
import type { Actions } from './$types';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const data = await request.formData();
		const email = String(data.get('email') ?? '').trim();
		const password = String(data.get('password') ?? '');
		const name = String(data.get('name') ?? '').trim();

		const values = { email, name };

		if (!EMAIL_RE.test(email)) {
			return fail(400, { ...values, error: 'Enter a valid email address.' });
		}
		if (password.length < 8) {
			return fail(400, { ...values, error: 'Password must be at least 8 characters.' });
		}
		if (await findUserByEmail(email)) {
			return fail(400, { ...values, error: 'An account with that email already exists.' });
		}

		const userId = await createAccount({ email, password, name });

		const token = generateSessionToken();
		await createSession(token, userId);
		setSessionCookie(cookies, token);

		redirect(302, '/sites');
	}
};
