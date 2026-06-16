import { redirect } from '@sveltejs/kit';
import { finalizePayment, readCallbackParams } from '$lib/server/payments/finalize';
import type { RequestHandler } from './$types';

// SSLCommerz redirects the browser here (GET in mock, POST in production).
const handle: RequestHandler = async ({ request, url }) => {
	const { tranId, valId } = await readCallbackParams(request, url);
	const ok = await finalizePayment(tranId, valId);
	redirect(303, ok ? '/billing?paid=1' : '/billing?failed=1');
};

export const GET = handle;
export const POST = handle;
