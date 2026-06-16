import { redirect } from '@sveltejs/kit';
import { markPayment } from '$lib/server/payments';
import { readCallbackParams } from '$lib/server/payments/finalize';
import type { RequestHandler } from './$types';

const handle: RequestHandler = async ({ request, url }) => {
	const { tranId } = await readCallbackParams(request, url);
	if (tranId) await markPayment(tranId, 'failed');
	redirect(303, '/billing?failed=1');
};

export const GET = handle;
export const POST = handle;
