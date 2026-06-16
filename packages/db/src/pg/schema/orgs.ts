import { pgEnum, pgTable, primaryKey, text, uuid } from 'drizzle-orm/pg-core';
import { timestamps } from './_helpers';
import { users } from './auth';

/** Tenant boundary. Owns sites and billing; users join via memberships. */
export const organizations = pgTable('organizations', {
	id: uuid('id').primaryKey().defaultRandom(),
	name: text('name').notNull(),
	slug: text('slug').notNull().unique(),
	...timestamps
});

export const memberRole = pgEnum('member_role', ['owner', 'admin', 'viewer']);

/** Many-to-many user↔org with a role. Composite PK prevents duplicates. */
export const memberships = pgTable(
	'memberships',
	{
		userId: uuid('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		orgId: uuid('org_id')
			.notNull()
			.references(() => organizations.id, { onDelete: 'cascade' }),
		role: memberRole('role').notNull().default('viewer'),
		...timestamps
	},
	(t) => [primaryKey({ columns: [t.userId, t.orgId] })]
);

export type Organization = typeof organizations.$inferSelect;
export type Membership = typeof memberships.$inferSelect;
export type MemberRole = (typeof memberRole.enumValues)[number];
