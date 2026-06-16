import { activateSubscription, getPaymentByTranId, markPayment } from './orders';
import { getProvider } from './index';

export interface CallbackParams {
	tranId: string | null;
	valId: string | null;
}

/** Read gateway callback params from either a GET query or a POSTed form. */
export async function readCallbackParams(request: Request, url: URL): Promise<CallbackParams> {
	if (request.method === 'POST') {
		const form = await request.formData().catch(() => null);
		if (form) {
			return { tranId: String(form.get('tran_id') ?? ''), valId: String(form.get('val_id') ?? '') };
		}
	}
	return { tranId: url.searchParams.get('tran_id'), valId: url.searchParams.get('val_id') };
}

/**
 * Validate a successful payment with the gateway and activate the subscription.
 * Session-independent (the gateway redirect is cross-site, so it authorizes via
 * the payment record + gateway-validated val_id) and idempotent.
 */
export async function finalizePayment(tranId: string | null, valId: string | null): Promise<boolean> {
	if (!tranId || !valId) return false;

	const payment = await getPaymentByTranId(tranId);
	if (!payment) return false;
	if (payment.status === 'success') return true; // already processed

	const { valid, cardToken } = await getProvider().validate({
		tranId,
		valId,
		amount: payment.amount
	});
	if (!valid) {
		await markPayment(tranId, 'failed', valId);
		return false;
	}

	await markPayment(tranId, 'success', valId);
	await activateSubscription(payment.orgId, payment.plan, { cardToken });
	return true;
}
