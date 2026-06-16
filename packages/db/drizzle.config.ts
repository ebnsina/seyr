import { defineConfig } from 'drizzle-kit';

const url = process.env.DATABASE_URL ?? 'postgresql://seyr:seyr@localhost:5432/seyr';

export default defineConfig({
	dialect: 'postgresql',
	schema: './src/pg/schema/index.ts',
	out: './migrations',
	dbCredentials: { url },
	casing: 'snake_case'
});
