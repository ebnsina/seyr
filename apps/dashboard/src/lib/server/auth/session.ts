import { sha256 } from '@oslojs/crypto/sha2';
import { encodeBase32LowerCaseNoPadding, encodeHexLowerCase } from '@oslojs/encoding';
import { eq } from 'drizzle-orm';
import { sessions, users } from '@seyr/db/pg';
import { db } from '../db';

export const SESSION_COOKIE = 'seyr_session';
const DAY_MS = 1000 * 60 * 60 * 24;
const SESSION_TTL_MS = 30 * DAY_MS;
const RENEW_THRESHOLD_MS = 15 * DAY_MS;

/** The minimal user shape carried on every request. */
export interface SessionUser {
	id: string;
	email: string;
	name: string | null;
}

export interface SessionValidation {
	user: SessionUser | null;
	sessionId: string | null;
}

/** Generate a high-entropy session token (handed to the client in a cookie). */
export function generateSessionToken(): string {
	const bytes = new Uint8Array(20);
	crypto.getRandomValues(bytes);
	return encodeBase32LowerCaseNoPadding(bytes);
}

/** The stored session id is the hash of the token — the raw token never lands in the DB. */
function tokenToId(token: string): string {
	return encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
}

/** Create a session row for a user and return its id + expiry. */
export async function createSession(token: string, userId: string) {
	const id = tokenToId(token);
	const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
	await db.insert(sessions).values({ id, userId, expiresAt });
	return { id, expiresAt };
}

/**
 * Validate a token: returns the user if the session exists and is unexpired.
 * Expired sessions are deleted; sessions near expiry are transparently renewed.
 */
export async function validateSessionToken(token: string): Promise<SessionValidation> {
	const id = tokenToId(token);
	const rows = await db
		.select({
			sessionId: sessions.id,
			expiresAt: sessions.expiresAt,
			userId: users.id,
			email: users.email,
			name: users.name
		})
		.from(sessions)
		.innerJoin(users, eq(sessions.userId, users.id))
		.where(eq(sessions.id, id))
		.limit(1);

	const row = rows[0];
	if (!row) return { user: null, sessionId: null };

	if (Date.now() >= row.expiresAt.getTime()) {
		await db.delete(sessions).where(eq(sessions.id, id));
		return { user: null, sessionId: null };
	}

	if (Date.now() >= row.expiresAt.getTime() - RENEW_THRESHOLD_MS) {
		const newExpiry = new Date(Date.now() + SESSION_TTL_MS);
		await db.update(sessions).set({ expiresAt: newExpiry }).where(eq(sessions.id, id));
	}

	return {
		user: { id: row.userId, email: row.email, name: row.name },
		sessionId: row.sessionId
	};
}

/** Invalidate a single session (logout). */
export async function invalidateSession(sessionId: string): Promise<void> {
	await db.delete(sessions).where(eq(sessions.id, sessionId));
}

export const sessionTtlMs = SESSION_TTL_MS;
