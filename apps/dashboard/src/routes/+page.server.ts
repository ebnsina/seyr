import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

// Send authenticated visitors straight to their dashboard; everyone else sees
// the marketing page.
export const load: PageServerLoad = ({ locals }) => {
	if (locals.user) redirect(302, '/sites');
	return {};
};
