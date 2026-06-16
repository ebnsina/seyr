/**
 * Provider-agnostic payment interface. SSLCommerz is the live adapter; a mock
 * adapter implements the same surface for local development. Swapping providers
 * is a config change, never a schema/route change.
 */

export interface InitiateParams {
	tranId: string;
	amount: number; // whole BDT
	currency: string; // 'BDT'
	planName: string;
	customerName: string;
	customerEmail: string;
	successUrl: string;
	failUrl: string;
	cancelUrl: string;
	ipnUrl: string;
}

export interface InitiateResult {
	/** Where to send the browser to complete payment. */
	redirectUrl: string;
}

export interface ValidateParams {
	tranId: string;
	valId: string;
	amount: number;
}

export interface ValidateResult {
	valid: boolean;
	/** Tokenized card reference for auto-renew, when the gateway returns one. */
	cardToken?: string;
}

export interface PaymentProvider {
	readonly name: string;
	initiate(params: InitiateParams): Promise<InitiateResult>;
	validate(params: ValidateParams): Promise<ValidateResult>;
}
