import { boolean, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { timestamps } from './_helpers';

/** Account identity. Auth credentials live here; org membership is separate. */
export const users = pgTable('users', {
	id: uuid('id').primaryKey().defaultRandom(),
	email: text('email').notNull().unique(),
	emailVerified: boolean('email_verified').notNull().default(false),
	/** Argon2/bcrypt hash; null for passwordless (magic-link only) accounts. */
	passwordHash: text('password_hash'),
	name: text('name'),
	...timestamps
});

/** Server-side sessions (opaque token in an httpOnly cookie). */
export const sessions = pgTable('sessions', {
	id: text('id').primaryKey(), // hashed session token
	userId: uuid('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	expiresAt: timestamp('expires_at', { withTimezone: true }).notNull()
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Session = typeof sessions.$inferSelect;
