import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import type { UserConfig } from 'vite';

// `test` is read by Vitest (which shares this config). Typed alongside Vite's
// UserConfig to sidestep the vitest/vite type-version mismatch.
const config: UserConfig & { test: Record<string, unknown> } = {
	plugins: [tailwindcss(), sveltekit()],
	test: {
		// Integration tests (*.test.ts touching the DB) self-skip when Postgres is
		// unreachable, so this stays green without infra.
		include: ['src/**/*.test.ts'],
		environment: 'node'
	}
};

export default config;
