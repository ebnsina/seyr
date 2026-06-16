import { env } from '$env/dynamic/private';
import { createDb } from '@seyr/db/pg';

const url = env.DATABASE_URL ?? 'postgresql://seyr:seyr@localhost:5432/seyr';

/** Shared Drizzle client for the dashboard's server code. */
export const db = createDb(url);
