import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema/index';

export type Database = ReturnType<typeof createDb>;

/**
 * Create a Drizzle client bound to the full schema. Callers own the lifecycle;
 * in long-running services create one instance and reuse it.
 */
export function createDb(connectionString: string) {
	const client = postgres(connectionString, { max: 10 });
	return drizzle(client, { schema });
}
