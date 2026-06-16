<script lang="ts">
	import { fly } from 'svelte/transition';

	type Row = { label: string; visitors: number; pageviews: number };
	type Props = {
		title: string;
		rows: Row[];
		/** Called when a row is clicked (applies a filter on that dimension). */
		onselect?: (label: string) => void;
		/** Optional label formatter (e.g. country code → name). */
		formatLabel?: (label: string) => string;
		/** Header for the right-hand metric column. */
		metricLabel?: string;
		emptyHint?: string;
	};

	let {
		title,
		rows,
		onselect,
		formatLabel = (l) => l,
		metricLabel = 'Visitors',
		emptyHint = 'No data yet'
	}: Props = $props();

	const max = $derived(Math.max(1, ...rows.map((r) => r.visitors)));
</script>

<div class="rounded-xl border border-border bg-surface p-5">
	<div class="mb-3 flex items-center justify-between">
		<h3 class="text-sm font-semibold">{title}</h3>
		<span class="text-xs text-muted">{metricLabel}</span>
	</div>

	{#if rows.length === 0}
		<p class="py-6 text-center text-sm text-muted">{emptyHint}</p>
	{:else}
		<ul class="flex flex-col gap-0.5">
			{#each rows as row, i (row.label)}
				<li in:fly={{ y: 6, duration: 350, delay: i * 35 }}>
					<button
						type="button"
						onclick={() => onselect?.(row.label)}
						class="group relative flex w-full items-center justify-between overflow-hidden rounded-md px-2 py-1.5 text-left transition-colors hover:bg-surface-2"
						title="Filter by {formatLabel(row.label)}"
					>
						<!-- relative-width bar behind the row -->
						<span
							class="absolute inset-y-0 left-0 rounded-md bg-accent-soft transition-[width] duration-500 ease-out"
							style="width: {(row.visitors / max) * 100}%"
						></span>
						<span class="relative z-10 truncate text-sm">{formatLabel(row.label)}</span>
						<span class="relative z-10 ml-3 font-mono text-sm tabular-nums text-muted group-hover:text-text">
							{row.visitors.toLocaleString()}
						</span>
					</button>
				</li>
			{/each}
		</ul>
	{/if}
</div>
