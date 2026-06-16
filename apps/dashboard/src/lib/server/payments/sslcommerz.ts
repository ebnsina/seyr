import type {
	InitiateParams,
	InitiateResult,
	PaymentProvider,
	ValidateParams,
	ValidateResult
} from './provider';

const BASE = {
	sandbox: 'https://sandbox.sslcommerz.com',
	live: 'https://securepay.sslcommerz.com'
};

/**
 * SSLCommerz adapter. Covers cards + bKash/Nagad/Rocket/bank via one integration.
 * Card tokenization (for auto-renew) is enabled per-store in the SSLCommerz
 * merchant panel; when active, the validation response carries a token.
 */
export class SslcommerzProvider implements PaymentProvider {
	readonly name = 'sslcommerz';
	private readonly base: string;

	constructor(
		private readonly storeId: string,
		private readonly storePasswd: string,
		mode: 'sandbox' | 'live' = 'sandbox'
	) {
		this.base = BASE[mode];
	}

	async initiate(params: InitiateParams): Promise<InitiateResult> {
		const body = new URLSearchParams({
			store_id: this.storeId,
			store_passwd: this.storePasswd,
			total_amount: String(params.amount),
			currency: params.currency,
			tran_id: params.tranId,
			success_url: params.successUrl,
			fail_url: params.failUrl,
			cancel_url: params.cancelUrl,
			ipn_url: params.ipnUrl,
			cus_name: params.customerName,
			cus_email: params.customerEmail,
			cus_phone: '01700000000',
			shipping_method: 'NO',
			product_name: params.planName,
			product_category: 'subscription',
			product_profile: 'non-physical-goods',
			emi_option: '0'
		});

		const res = await fetch(`${this.base}/gwprocess/v4/api.php`, {
			method: 'POST',
			headers: { 'content-type': 'application/x-www-form-urlencoded' },
			body
		});
		const data = (await res.json()) as { status: string; GatewayPageURL?: string; failedreason?: string };
		if (data.status !== 'SUCCESS' || !data.GatewayPageURL) {
			throw new Error(`SSLCommerz init failed: ${data.failedreason ?? data.status}`);
		}
		return { redirectUrl: data.GatewayPageURL };
	}

	async validate(params: ValidateParams): Promise<ValidateResult> {
		const url = new URL(`${this.base}/validator/api/validationserverAPI.php`);
		url.searchParams.set('val_id', params.valId);
		url.searchParams.set('store_id', this.storeId);
		url.searchParams.set('store_passwd', this.storePasswd);
		url.searchParams.set('format', 'json');

		const res = await fetch(url);
		const data = (await res.json()) as {
			status: string;
			amount: string;
			tran_id: string;
			token?: string;
		};

		const ok =
			(data.status === 'VALID' || data.status === 'VALIDATED') &&
			data.tran_id === params.tranId &&
			Number(data.amount) >= params.amount;

		return { valid: ok, cardToken: data.token || undefined };
	}
}
