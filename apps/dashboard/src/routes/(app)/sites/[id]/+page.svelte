<script lang="ts">
	import { onDestroy } from 'svelte';
	import { fade, fly } from 'svelte/transition';
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import { Button, Card, Badge } from '$lib/components/ui';
	import { buildSnippet } from '$lib/snippet';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const snippet = $derived(buildSnippet(data.scriptHost, data.site.domain));

	const shareUrl = $derived(
		data.site.isPublic && data.site.shareToken
			? `${page.url.origin}/share/${data.site.shareToken}`
			: null
	);
	let shareCopied = $state(false);
	async function copyShare() {
		if (!shareUrl) return;
		await navigator.clipboard.writeText(shareUrl);
		shareCopied = true;
		setTimeout(() => (shareCopied = false), 1800);
	}

	let copied = $state(false);
	let verified = $state(data.events > 0);
	let checking = $state(false);
	let polling = $state(false);
	let timer: ReturnType<typeof setInterval> | null = null;

	async function copy() {
		await navigator.clipboard.writeText(snippet);
		copied = true;
		setTimeout(() => (copied = false), 1800);
	}

	async function checkOnce() {
		checking = true;
		try {
			const res = await fetch(`/sites/${data.site.id}/verify`);
			const body = (await res.json()) as { received: boolean };
			if (body.received) {
				verified = true;
				stopPolling();
			}
		} finally {
			checking = false;
		}
	}

	function startPolling() {
		if (verified || polling) return;
		polling = true;
		void checkOnce();
		timer = setInterval(checkOnce, 3000);
	}

	function stopPolling() {
		polling = false;
		if (timer) clearInterval(timer);
		timer = null;
	}

	onDestroy(stopPolling);
</script>

<svelte:head><title>{data.site.domain} · Setup · seyr</title></svelte:head>

<a href="/sites" class="text-sm text-muted transition-colors hover:text-text">← All sites</a>

<div class="mt-3 flex items-center gap-3">
	<h1 class="font-display text-2xl font-semibold tracking-tight">{data.site.domain}</h1>
	{#if verified}
		<Badge tone="success"><span class="size-1.5 rounded-full bg-success"></span> Receiving data</Badge>
	{:else}
		<Badge tone="muted">Not yet installed</Badge>
	{/if}
</div>

<div class="mt-6 grid gap-6 lg:grid-cols-5">
	<!-- install instructions -->
	<div class="lg:col-span-3">
		<Card>
			<h2 class="font-medium">Install the tracking snippet</h2>
			<p class="mt-1 text-sm text-muted">
				Paste this into the <code class="rounded bg-surface-2 px-1 font-mono text-xs">&lt;head&gt;</code>
				of every page you want to measure.
			</p>

			<div class="relative mt-4">
				<pre class="overflow-x-auto rounded-lg border border-border bg-surface-2 p-4 font-mono text-xs leading-relaxed text-text"><code>{snippet}</code></pre>
				<button
					onclick={copy}
					class="focus-ring absolute right-2 top-2 rounded-md bg-surface px-2.5 py-1 text-xs font-medium text-muted transition-colors hover:text-text"
				>
					{copied ? 'Copied ✓' : 'Copy'}
				</button>
			</div>

			<p class="mt-3 text-xs text-muted">
				No cookies, no consent banner needed. The script is ~0.8&nbsp;KB and loads asynchronously.
			</p>
		</Card>
	</div>

	<!-- verification -->
	<div class="lg:col-span-2">
		<Card class="h-full">
			<h2 class="font-medium">Verify installation</h2>
			{#if verified}
				<div class="mt-4 flex flex-col items-center py-6 text-center" in:fade>
					<div class="mb-3 grid size-12 place-items-center rounded-full bg-success/15 text-success">
						<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
					</div>
					<p class="font-medium">You're all set!</p>
					<p class="mt-1 text-sm text-muted">seyr is receiving events from {data.site.domain}.</p>
					<Button href="/sites/{data.site.id}/stats" class="mt-4 w-full">View dashboard →</Button>
				</div>
			{:else}
				<p class="mt-1 text-sm text-muted">
					Once the snippet is live, load a page on your site. We'll detect the first event
					automatically.
				</p>
				<div class="mt-4">
					{#if polling}
						<div class="flex items-center gap-2 text-sm text-muted" in:fade>
							<span class="size-4 animate-spin rounded-full border-2 border-accent border-t-transparent"></span>
							Listening for events…
						</div>
					{:else}
						<Button variant="outline" class="w-full" loading={checking} onclick={startPolling}>
							Check for data
						</Button>
					{/if}
				</div>
			{/if}
		</Card>
	</div>
</div>

<!-- public dashboard -->
<Card class="mt-3">
	<div class="flex flex-wrap items-start justify-between gap-3">
		<div>
			<h2 class="font-medium">Public dashboard</h2>
			<p class="mt-1 text-sm text-muted">
				Share a read-only view of these stats with anyone — no login required.
			</p>
		</div>
		<form method="POST" action="?/togglePublic" use:enhance>
			<input type="hidden" name="enabled" value={data.site.isPublic ? 'false' : 'true'} />
			<Button type="submit" variant={data.site.isPublic ? 'outline' : 'primary'} size="sm">
				{data.site.isPublic ? 'Make private' : 'Make public'}
			</Button>
		</form>
	</div>

	{#if shareUrl}
		<div class="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center" in:fade>
			<code
				class="min-w-0 flex-1 truncate rounded-lg border border-border bg-surface-2 px-3 py-2 font-mono text-xs"
			>
				{shareUrl}
			</code>
			<div class="flex shrink-0 gap-2">
				<Button variant="outline" size="sm" onclick={copyShare}>
					{shareCopied ? 'Copied ✓' : 'Copy link'}
				</Button>
				<Button href={shareUrl} target="_blank" variant="ghost" size="sm">Open ↗</Button>
				<form method="POST" action="?/regenerateShare" use:enhance>
					<Button type="submit" variant="ghost" size="sm">Reset link</Button>
				</form>
			</div>
		</div>
	{/if}
</Card>
