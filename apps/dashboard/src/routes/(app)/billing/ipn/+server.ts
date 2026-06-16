import { text } from '@sveltejs/kit';
import { finalizePayment, readCallbackParams } from '$lib/server/payments/finalize';
import type { RequestHandler } from './$types';

// Server-to-server notification from SSLCommerz. Idempotent with the browser
// success callback — whichever arrives first activates the subscription.
export const POST: RequestHandler = async ({ request, url }) => {
	const { tranId, valId } = await readCallbackParams(request, url);
	await finalizePayment(tranId, valId);
	return text('OK');
};
