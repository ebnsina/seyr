import { eq } from 'drizzle-orm';
import { memberships, organizations, users } from '@seyr/db/pg';
import { db } from '../db';
import { hashPassword } from './password';

/** Look up a user by email (case-insensitive). */
export async function findUserByEmail(email: string) {
	const rows = await db
		.select()
		.from(users)
		.where(eq(users.email, email.toLowerCase()))
		.limit(1);
	return rows[0] ?? null;
}

function slugify(input: string): string {
	const base = input
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.slice(0, 32);
	const suffix = Math.random().toString(36).slice(2, 6);
	return `${base || 'workspace'}-${suffix}`;
}

export interface NewAccount {
	email: string;
	password: string;
	name?: string;
	orgName?: string;
}

/**
 * Create a user together with their first organization and an owner membership,
 * atomically. Returns the new user's id.
 */
export async function createAccount(input: NewAccount): Promise<string> {
	const email = input.email.toLowerCase();
	const passwordHash = await hashPassword(input.password);
	const orgName = input.orgName?.trim() || `${input.name?.trim() || 'My'} workspace`;

	return db.transaction(async (tx) => {
		const [user] = await tx
			.insert(users)
			.values({ email, passwordHash, name: input.name?.trim() || null })
			.returning({ id: users.id });

		const [org] = await tx
			.insert(organizations)
			.values({ name: orgName, slug: slugify(orgName) })
			.returning({ id: organizations.id });

		await tx.insert(memberships).values({ userId: user!.id, orgId: org!.id, role: 'owner' });

		return user!.id;
	});
}
