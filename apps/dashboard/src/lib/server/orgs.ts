import { desc, eq } from 'drizzle-orm';
import { memberships, organizations } from '@seyr/db/pg';
import { db } from './db';

export interface UserOrg {
	id: string;
	name: string;
	slug: string;
	role: string;
}

/** All organizations a user belongs to, with their role in each. */
export async function getUserOrgs(userId: string): Promise<UserOrg[]> {
	return db
		.select({
			id: organizations.id,
			name: organizations.name,
			slug: organizations.slug,
			role: memberships.role
		})
		.from(memberships)
		.innerJoin(organizations, eq(memberships.orgId, organizations.id))
		.where(eq(memberships.userId, userId))
		.orderBy(desc(memberships.createdAt));
}
