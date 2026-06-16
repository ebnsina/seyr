import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

// Logged-in users have no business on the auth screens.
export const load: LayoutServerLoad = ({ locals }) => {
	if (locals.user) redirect(302, '/sites');
	return {};
};
