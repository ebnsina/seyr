<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { Badge } from '$lib/components/ui';
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
		{ key: 'page', title: 'Top Pages', color: '#a3e635' },
		{ key: 'source', title: 'Sources', color: '#22d3ee' },
		{ key: 'country', title: 'Countries', color: '#fbbf24' },
		{ key: 'browser', title: 'Browsers', color: '#a78bfa' },
		{ key: 'os', title: 'Operating Systems', color: '#fb7185' },
		{ key: 'device', title: 'Devices', color: '#60a5fa' }
	] as const;

	const FILTER_LABELS: Record<string, string> = {
		page: 'Page',
		source: 'Source',
		country: 'Country',
		browser: 'Browser',
		os: 'OS',
		device: 'Device'
	};

	/** Navigate, merging query params (null value removes the key). */
	function navigate(updates: Record<string, string | null>) {
		const params = new URLSearchParams(page.url.searchParams);
		for (const [k, v] of Object.entries(updates)) {
			if (v === null) params.delete(k);
			else params.set(k, v);
		}
		goto(`?${params.toString()}`, { keepFocus: true, noScroll: true });
	}

	const activeFilters = $derived(Object.entries(data.filters) as [string, string][]);

	const fmtDuration = (s: number) => {
		const m = Math.floor(s / 60);
		const sec = Math.round(s % 60);
		return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
	};
	const fmtPercent = (v: number) => `${Math.round(v * 100)}%`;
</script>

<svelte:head><title>{data.site.domain} · Analytics · seyr</title></svelte:head>

<div class="flex flex-wrap items-center justify-between gap-3">
	<div>
		<a href="/sites" class="text-sm text-muted transition-colors hover:text-text">← All sites</a>
		<h1 class="font-display text-2xl font-semibold tracking-tight">{data.site.domain}</h1>
	</div>

	<!-- range picker -->
	<div class="flex rounded-lg border border-border bg-surface p-1">
		{#each RANGES as r (r.key)}
			<button
				onclick={() => navigate({ range: r.key })}
				class="rounded-md px-3 py-1 text-sm font-medium transition-colors
					{data.range === r.key ? 'bg-accent text-accent-fg' : 'text-muted hover:text-text'}"
			>
				{r.label}
			</button>
		{/each}
	</div>
</div>

<!-- active filter chips -->
{#if activeFilters.length}
	<div class="mt-4 flex flex-wrap items-center gap-2">
		<span class="text-xs text-muted">Filtered by</span>
		{#each activeFilters as [key, value] (key)}
			<button onclick={() => navigate({ [key]: null })} class="transition-transform hover:scale-105">
				<Badge tone="accent">
					{FILTER_LABELS[key] ?? key}: {value}
					<span class="ml-0.5 text-accent/70">✕</span>
				</Badge>
			</button>
		{/each}
		<button onclick={() => navigate(Object.fromEntries(activeFilters.map(([k]) => [k, null])))} class="text-xs text-muted hover:text-text">
			Clear all
		</button>
	</div>
{/if}

<!-- top-line cards -->
<div class="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
	<StatCard label="Unique visitors" value={data.dashboard.totals.visitors} previous={data.dashboard.previous.visitors} />
	<StatCard label="Total pageviews" value={data.dashboard.totals.pageviews} previous={data.dashboard.previous.pageviews} />
	<StatCard
		label="Bounce rate"
		value={data.dashboard.totals.bounceRate}
		previous={data.dashboard.previous.bounceRate}
		format={fmtPercent}
		goodDirection="down"
	/>
	<StatCard
		label="Avg. visit time"
		value={data.dashboard.totals.avgDuration}
		previous={data.dashboard.previous.avgDuration}
		format={fmtDuration}
	/>
</div>

<!-- visitors over time -->
<div class="mt-3 rounded-xl border border-border bg-surface p-5">
	<p class="mb-2 text-sm font-semibold">Visitors over time</p>
	{#key data.range + JSON.stringify(data.filters)}
		<AreaChart points={data.dashboard.timeseries} />
	{/key}
</div>

<!-- breakdown panels -->
<div class="mt-3 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
	{#each PANELS as panel (panel.key)}
		<BreakdownPanel
			title={panel.title}
			barColor={panel.color}
			rows={data.dashboard.breakdowns[panel.key]}
			onselect={(label) => navigate({ [panel.key]: label })}
		/>
	{/each}
</div>

<!-- goals & custom events -->
<div class="mt-3">
	<BreakdownPanel
		title="Goals & Custom Events"
		metricLabel="Completions"
		barColor="#fb923c"
		emptyHint="No custom events yet — fire them with seyr('event', 'Name')."
		rows={data.dashboard.customEvents.map((e) => ({
			label: e.label,
			visitors: e.count,
			pageviews: e.visitors
		}))}
	/>
</div>
