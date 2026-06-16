import { env } from '$env/dynamic/private';
import { error, json } from '@sveltejs/kit';
import { processDueRenewals } from '$lib/server/payments/renewals';
import type { RequestHandler } from './$types';

/**
 * Triggered by a scheduler (e.g. a cron hitting this URL) to charge due
 * auto-renew subscriptions. Protected by a shared secret; if CRON_SECRET is
 * unset the endpoint is disabled.
 */
export const POST: RequestHandler = async ({ request }) => {
	const secret = env.CRON_SECRET;
	if (!secret || request.headers.get('x-cron-secret') !== secret) error(403, 'Forbidden');

	const result = await processDueRenewals();
	return json(result);
};
