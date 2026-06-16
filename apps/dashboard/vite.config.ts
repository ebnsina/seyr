import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	test: {
		// Server-side logic tests. Integration tests (*.test.ts that touch the DB)
		// self-skip when Postgres is unreachable, so this stays green without infra.
		include: ['src/**/*.test.ts'],
		environment: 'node'
	}
});
