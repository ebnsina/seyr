<script lang="ts">
	import { AnimatedNumber } from '$lib/components/ui';

	type Props = {
		label: string;
		value: number;
		previous?: number;
		format?: (n: number) => string;
		/** Which direction counts as "good" (controls delta color). */
		goodDirection?: 'up' | 'down';
	};

	let {
		label,
		value,
		previous,
		format = (n) => Math.round(n).toLocaleString(),
		goodDirection = 'up'
	}: Props = $props();

	const delta = $derived(
		previous && previous > 0 ? ((value - previous) / previous) * 100 : null
	);
	const positive = $derived(delta !== null && delta >= 0);
	const good = $derived(delta === null ? true : (goodDirection === 'up') === positive);
</script>

<div class="rounded-xl border border-border bg-surface p-5">
	<p class="text-sm text-muted">{label}</p>
	<div class="mt-2 flex items-baseline gap-2">
		<span class="font-mono text-3xl font-semibold tracking-tight">
			<AnimatedNumber {value} {format} />
		</span>
		{#if delta !== null}
			<span class="text-xs font-medium {good ? 'text-success' : 'text-danger'}">
				{positive ? '▲' : '▼'}
				{Math.abs(delta).toFixed(1)}%
			</span>
		{/if}
	</div>
</div>
