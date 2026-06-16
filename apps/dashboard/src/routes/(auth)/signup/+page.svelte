<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button, Card, Input } from '$lib/components/ui';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
	let loading = $state(false);
</script>

<svelte:head><title>Sign up · seyr</title></svelte:head>

<Card class="p-7">
	<h1 class="font-display text-2xl font-semibold tracking-tight">Create your account</h1>
	<p class="mt-1 text-sm text-muted">Start measuring in minutes — free up to 10k events.</p>

	<form
		method="POST"
		class="mt-6 flex flex-col gap-4"
		use:enhance={() => {
			loading = true;
			return async ({ update }) => {
				await update();
				loading = false;
			};
		}}
	>
		{#if form?.error}
			<div class="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{form.error}</div>
		{/if}
		<Input name="name" type="text" label="Name" placeholder="Ada Lovelace" autocomplete="name" value={form?.name ?? ''} />
		<Input
			name="email"
			type="email"
			label="Email"
			placeholder="you@company.com"
			autocomplete="email"
			required
			value={form?.email ?? ''}
		/>
		<Input
			name="password"
			type="password"
			label="Password"
			placeholder="At least 8 characters"
			autocomplete="new-password"
			required
		/>
		<Button type="submit" {loading} class="mt-1 w-full">Create account</Button>
	</form>

	<p class="mt-5 text-center text-sm text-muted">
		Already have an account?
		<a href="/login" class="font-medium text-accent hover:underline">Log in</a>
	</p>
</Card>
