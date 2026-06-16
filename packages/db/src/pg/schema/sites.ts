import { bigint, boolean, pgTable, text, uuid } from 'drizzle-orm/pg-core';
import { timestamps } from './_helpers';
import { organizations } from './orgs';

/**
 * A tracked website. `id` is a bigint identity that doubles as the ClickHouse
 * `events.site_id` (UInt64) — keeping a single numeric key across both stores.
 */
export const sites = pgTable('sites', {
	id: bigint('id', { mode: 'bigint' }).primaryKey().generatedAlwaysAsIdentity(),
	orgId: uuid('org_id')
		.notNull()
		.references(() => organizations.id, { onDelete: 'cascade' }),
	/** Bare domain the tracker reports, e.g. "example.com". */
	domain: text('domain').notNull().unique(),
	/** IANA timezone used to bucket stats into local days. */
	timezone: text('timezone').notNull().default('UTC'),
	/** When true the dashboard is viewable without auth via `shareToken`. */
	isPublic: boolean('is_public').notNull().default(false),
	shareToken: text('share_token').unique(),
	...timestamps
});

export type Site = typeof sites.$inferSelect;
export type NewSite = typeof sites.$inferInsert;
