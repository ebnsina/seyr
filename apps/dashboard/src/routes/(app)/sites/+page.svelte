<script lang="ts">
	import { enhance } from '$app/forms';
	import { fly, fade } from 'svelte/transition';
	import { Button, Card, Input, Badge } from '$lib/components/ui';
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let showAdd = $state(false);
	let adding = $state(false);

	// Open the add form automatically when there are no sites yet.
	const empty = $derived(data.sites.length === 0);

	// `form` is a union across actions; read create-action fields defensively.
	const formError = $derived(form && 'error' in form ? form.error : undefined);
	const formDomain = $derived(form && 'domain' in form ? String(form.domain ?? '') : '');
</script>

<svelte:head><title>Sites · seyr</title></svelte:head>

<div class="flex items-center justify-between">
	<div>
		<h1 class="font-display text-2xl font-semibold tracking-tight">Your sites</h1>
		<p class="mt-1 text-sm text-muted">Track a website by adding its domain.</p>
	</div>
	{#if !empty}
		<Button size="sm" onclick={() => (showAdd = !showAdd)}>
			{showAdd ? 'Cancel' : '+ Add site'}
		</Button>
	{/if}
</div>

{#if showAdd || empty}
	<div in:fly={{ y: -8, duration: 300 }}>
		<Card class="mt-6">
			<form
				method="POST"
				action="?/create"
				class="flex flex-col gap-3 sm:flex-row sm:items-end"
				use:enhance={() => {
					adding = true;
					return async ({ update }) => {
						await update();
						adding = false;
						showAdd = false;
					};
				}}
			>
				<div class="flex-1">
					<Input
						name="domain"
						label="Domain"
						placeholder="example.com"
						value={formDomain ?? ''}
						error={formError}
						autocomplete="off"
					/>
				</div>
				<Button type="submit" loading={adding}>Add site</Button>
			</form>
		</Card>
	</div>
{/if}

{#if empty}
	<div class="mt-10 flex flex-col items-center justify-center py-16 text-center" in:fade>
		<div class="mb-4 grid size-14 place-items-center rounded-2xl bg-accent-soft text-accent">
			<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
		</div>
		<p class="font-medium">No sites yet</p>
		<p class="mt-1 max-w-xs text-sm text-muted">Add your first domain above to get your tracking snippet.</p>
	</div>
{:else}
	<div class="mt-6 grid gap-3 sm:grid-cols-2">
		{#each data.sites as site, i (site.id)}
			<div in:fly={{ y: 12, duration: 400, delay: i * 50 }}>
				<a href="/sites/{site.id}" class="block">
					<Card interactive>
						<div class="flex items-start justify-between">
							<div>
								<p class="font-medium">{site.domain}</p>
								<p class="mt-0.5 text-xs text-muted">{site.timezone}</p>
							</div>
							{#if site.events > 0}
								<Badge tone="success">
									<span class="size-1.5 rounded-full bg-success"></span>
									Live
								</Badge>
							{:else}
								<Badge tone="muted">Awaiting data</Badge>
							{/if}
						</div>
						<div class="mt-4 flex items-end justify-between">
							<div>
								<p class="font-mono text-2xl font-semibold">{site.events.toLocaleString()}</p>
								<p class="text-xs text-muted">events all-time</p>
							</div>
							<form
								method="POST"
								action="?/delete"
								use:enhance
								onsubmit={(e) => {
									if (!confirm(`Stop tracking ${site.domain}? This removes the site.`))
										e.preventDefault();
								}}
							>
								<input type="hidden" name="id" value={site.id} />
								<button
									class="rounded-lg p-2 text-muted transition-colors hover:bg-danger/10 hover:text-danger"
									aria-label="Delete site"
									onclick={(e) => e.stopPropagation()}
								>
									<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>
								</button>
							</form>
						</div>
					</Card>
				</a>
			</div>
		{/each}
	</div>
{/if}
