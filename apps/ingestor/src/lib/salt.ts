import { createHash } from 'node:crypto';

/**
 * Daily-rotating salt manager. The salt is derived from a server secret plus the
 * current UTC date, so it:
 *   - rotates every 24h (a visitor cannot be linked across days),
 *   - is stable within a day even across process restarts (no fragmented
 *     visitors mid-day, unlike an in-memory random salt).
 *
 * Privacy trade-off: deriving from a secret means past days are reconstructable
 * if the secret leaks. For stronger guarantees, swap this for a random salt
 * persisted in a shared store (Redis) and rotated on a cron — the interface
 * stays the same.
 */
export class SaltManager {
	constructor(private readonly secret: string) {}

	private dayKey(date: Date): string {
		return date.toISOString().slice(0, 10); // YYYY-MM-DD (UTC)
	}

	/** Current salt for the given moment (defaults to now). */
	current(now: Date = new Date()): string {
		return createHash('sha256')
			.update(this.secret + '|' + this.dayKey(now))
			.digest('hex');
	}
}
