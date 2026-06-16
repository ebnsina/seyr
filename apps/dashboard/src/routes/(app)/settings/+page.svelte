<script lang="ts">
	import { Card } from '$lib/components/ui';
	import type { LayoutData } from '../$types';

	let { data }: { data: LayoutData } = $props();
</script>

<svelte:head><title>Settings · seyr</title></svelte:head>

<h1 class="font-display text-2xl font-semibold tracking-tight">Settings</h1>

<Card class="mt-6 space-y-3">
	<div>
		<p class="text-xs text-muted">Name</p>
		<p class="text-sm">{data.user.name ?? '—'}</p>
	</div>
	<div>
		<p class="text-xs text-muted">Email</p>
		<p class="text-sm">{data.user.email}</p>
	</div>
	<div>
		<p class="text-xs text-muted">Organization</p>
		<p class="text-sm">{data.currentOrg?.name ?? '—'}</p>
	</div>
</Card>
