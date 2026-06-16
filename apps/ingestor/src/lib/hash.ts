import { createHash } from 'node:crypto';

/**
 * Deterministic 64-bit hash of a string, returned as a bigint suitable for a
 * ClickHouse UInt64 column. Takes the first 8 bytes of SHA-256.
 */
export function hash64(input: string): bigint {
	const digest = createHash('sha256').update(input).digest();
	return digest.readBigUInt64BE(0);
}
