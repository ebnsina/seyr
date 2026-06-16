import { env } from '$env/dynamic/private';
import { MockProvider } from './mock';
import { SslcommerzProvider } from './sslcommerz';
import type { PaymentProvider } from './provider';

export * from './provider';
export * from './orders';

let cached: PaymentProvider | null = null;

/**
 * Resolve the active payment provider from env. Defaults to the mock provider
 * for local dev; set SSLCZ_MODE=sandbox|live with store credentials to go real.
 */
export function getProvider(): PaymentProvider {
	if (cached) return cached;

	const mode = env.SSLCZ_MODE ?? 'mock';
	const storeId = env.SSLCZ_STORE_ID;
	const storePasswd = env.SSLCZ_STORE_PASSWD;

	if (mode === 'mock' || !storeId || !storePasswd) {
		cached = new MockProvider();
	} else {
		cached = new SslcommerzProvider(storeId, storePasswd, mode === 'live' ? 'live' : 'sandbox');
	}
	return cached;
}
