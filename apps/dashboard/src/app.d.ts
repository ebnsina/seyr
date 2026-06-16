// See https://svelte.dev/docs/kit/types#app.d.ts
declare global {
	namespace App {
		interface Locals {
			// Populated by the auth handle hook (Phase B).
			user: { id: string; email: string; name: string | null } | null;
			sessionId: string | null;
		}
	}
}

export {};
