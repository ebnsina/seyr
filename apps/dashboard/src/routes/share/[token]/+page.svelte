<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { Logo, Badge } from '$lib/components/ui';
	import StatCard from '$lib/components/stats/StatCard.svelte';
	import AreaChart from '$lib/components/stats/AreaChart.svelte';
	import BreakdownPanel from '$lib/components/stats/BreakdownPanel.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const RANGES = [
		{ key: '24h', label: '24h' },
		{ key: '7d', label: '7d' },
		{ key: '30d', label: '30d' },
		{ key: '90d', label: '90d' }
	];
	const PANELS = [
		{ key: 'page', title: 'Top Pages' },
		{ key: 'source', title: 'Sources' },
		{ key: 'country', title: 'Countries' },
		{ key: 'browser', title: 'Browsers' },
		{ key: 'os', title: 'Operating Systems' },
		{ key: 'device', title: 'Devices' }
	] as const;

	function setRange(r: string) {
		const params = new URLSearchParams(page.url.searchParams);
		params.set('range', r);
		goto(`?${params.toString()}`, { noScroll: true });
	}

	const fmtDuration = (s: number) => {
		const m = Math.floor(s / 60);
		return m > 0 ? `${m}m ${Math.round(s % 60)}s` : `${Math.round(s)}s`;
	};
	const fmtPercent = (v: number) => `${Math.round(v * 100)}%`;
</script>

<svelte:head>
	<title>{data.domain} · Analytics</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="min-h-dvh bg-bg">
	<header class="border-b border-border">
		<div class="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
			<div class="flex items-center gap-3">
				<span class="font-display text-lg font-semibold">{data.domain}</span>
				<Badge tone="muted">Public</Badge>
			</div>
			<a href="/" class="flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-text">
				<span>Powered by</span><Logo size={18} />
			</a>
		</div>
	</header>

	<main class="mx-auto max-w-5xl px-6 py-8">
		<div class="flex justify-end">
			<div class="flex rounded-lg border border-border bg-surface p-1">
				{#each RANGES as r (r.key)}
					<button
						onclick={() => setRange(r.key)}
						class="rounded-md px-3 py-1 text-sm font-medium transition-colors
							{data.range === r.key ? 'bg-accent text-accent-fg' : 'text-muted hover:text-text'}"
					>
						{r.label}
					</button>
				{/each}
			</div>
		</div>

		<div class="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
			<StatCard label="Unique visitors" value={data.dashboard.totals.visitors} previous={data.dashboard.previous.visitors} />
			<StatCard label="Total pageviews" value={data.dashboard.totals.pageviews} previous={data.dashboard.previous.pageviews} />
			<StatCard label="Bounce rate" value={data.dashboard.totals.bounceRate} previous={data.dashboard.previous.bounceRate} format={fmtPercent} goodDirection="down" />
			<StatCard label="Avg. visit time" value={data.dashboard.totals.avgDuration} previous={data.dashboard.previous.avgDuration} format={fmtDuration} />
		</div>

		<div class="mt-3 rounded-xl border border-border bg-surface p-5">
			<p class="mb-2 text-sm font-semibold">Visitors over time</p>
			{#key data.range}
				<AreaChart points={data.dashboard.timeseries} />
			{/key}
		</div>

		<div class="mt-3 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
			{#each PANELS as panel (panel.key)}
				<BreakdownPanel title={panel.title} rows={data.dashboard.breakdowns[panel.key]} />
			{/each}
		</div>
	</main>
</div>
