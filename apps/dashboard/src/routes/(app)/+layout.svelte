<script lang="ts">
	import type { Snippet } from 'svelte';
	import { page } from '$app/state';
	import { Logo, ThemeToggle, Badge } from '$lib/components/ui';
	import type { LayoutData } from './$types';

	let { data, children }: { data: LayoutData; children: Snippet } = $props();

	const nav = [
		{ href: '/sites', label: 'Sites' },
		{ href: '/settings', label: 'Settings' }
	];

	let menuOpen = $state(false);
	const initial = $derived((data.user.name ?? data.user.email).charAt(0).toUpperCase());
</script>

<div class="min-h-dvh bg-bg">
	<header class="sticky top-0 z-40 border-b border-border bg-bg/80 backdrop-blur-md">
		<div class="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
			<div class="flex items-center gap-3">
				<a href="/sites"><Logo /></a>
				{#if data.currentOrg}
					<span class="text-border">/</span>
					<Badge tone="muted">{data.currentOrg.name}</Badge>
				{/if}
			</div>

			<nav class="flex items-center gap-1">
				{#each nav as item (item.href)}
					{@const active = page.url.pathname.startsWith(item.href)}
					<a
						href={item.href}
						class="rounded-lg px-3 py-1.5 text-sm font-medium transition-colors
							{active ? 'bg-surface-2 text-text' : 'text-muted hover:text-text'}"
					>
						{item.label}
					</a>
				{/each}

				<div class="ml-1"><ThemeToggle /></div>

				<div class="relative ml-1">
					<button
						onclick={() => (menuOpen = !menuOpen)}
						class="focus-ring grid size-9 place-items-center rounded-full bg-accent text-sm font-semibold text-accent-fg"
						aria-label="Account menu"
					>
						{initial}
					</button>
					{#if menuOpen}
						<!-- click-away backdrop -->
						<button
							class="fixed inset-0 z-10 cursor-default"
							onclick={() => (menuOpen = false)}
							tabindex="-1"
							aria-label="Close menu"
						></button>
						<div
							class="absolute right-0 z-20 mt-2 w-56 rounded-xl border border-border bg-surface p-1.5 shadow-xl"
						>
							<div class="px-3 py-2">
								<p class="truncate text-sm font-medium">{data.user.name ?? 'Account'}</p>
								<p class="truncate text-xs text-muted">{data.user.email}</p>
							</div>
							<div class="my-1 h-px bg-border"></div>
							<form method="POST" action="/logout">
								<button
									class="w-full rounded-lg px-3 py-2 text-left text-sm text-muted transition-colors hover:bg-surface-2 hover:text-danger"
								>
									Log out
								</button>
							</form>
						</div>
					{/if}
				</div>
			</nav>
		</div>
	</header>

	<main class="mx-auto max-w-6xl px-6 py-8">
		{@render children()}
	</main>
</div>
