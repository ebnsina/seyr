import { fail, redirect } from '@sveltejs/kit';
import {
	createSession,
	findUserByEmail,
	generateSessionToken,
	setSessionCookie,
	verifyPassword
} from '$lib/server/auth';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const form = await request.formData();
		const email = String(form.get('email') ?? '').trim();
		const password = String(form.get('password') ?? '');

		if (!email || !password) {
			return fail(400, { email, error: 'Enter your email and password.' });
		}

		const user = await findUserByEmail(email);
		// Verify even when the user is missing to keep timing roughly constant.
		const ok = user?.passwordHash
			? await verifyPassword(user.passwordHash, password)
			: await verifyPassword(
					'$argon2id$v=19$m=19456,t=2,p=1$AAAAAAAAAAAAAAAAAAAAAA$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
					password
				).then(() => false);

		if (!user || !ok) {
			return fail(400, { email, error: 'Invalid email or password.' });
		}

		const token = generateSessionToken();
		await createSession(token, user.id);
		setSessionCookie(cookies, token);

		redirect(302, '/sites');
	}
};
