import type {
	ChargeParams,
	InitiateParams,
	InitiateResult,
	PaymentProvider,
	ValidateParams,
	ValidateResult
} from './provider';

/**
 * Local development provider. "initiate" sends the browser straight to our own
 * success callback (no external gateway), and "validate" approves any mock
 * transaction. Lets the entire subscription state machine be exercised offline.
 */
export class MockProvider implements PaymentProvider {
	readonly name = 'mock';

	async initiate(params: InitiateParams): Promise<InitiateResult> {
		const url = new URL(params.successUrl);
		url.searchParams.set('tran_id', params.tranId);
		url.searchParams.set('val_id', `mock_${params.tranId}`);
		url.searchParams.set('status', 'VALID');
		return { redirectUrl: url.toString() };
	}

	async validate(params: ValidateParams): Promise<ValidateResult> {
		// A mock card token simulates a tokenized (auto-renewable) card payment.
		return { valid: params.valId.startsWith('mock_'), cardToken: `mocktok_${params.tranId}` };
	}

	async chargeToken(params: ChargeParams): Promise<{ success: boolean }> {
		return { success: params.cardToken.startsWith('mocktok_') };
	}
}
