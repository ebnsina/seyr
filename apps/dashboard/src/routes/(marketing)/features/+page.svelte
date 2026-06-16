<script lang="ts">
	import { fly } from 'svelte/transition';
	import { Card, Button } from '$lib/components/ui';

	// Minimal stroke icons (lucide-style) — keyed by name, rendered in a shared frame.
	const icons: Record<string, string> = {
		shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/>',
		zap: '<path d="M13 2 3 14h9l-1 8 10-12h-9l1-8Z"/>',
		chart: '<path d="M3 3v18h18"/><rect x="7" y="12" width="3" height="6"/><rect x="12" y="8" width="3" height="10"/><rect x="17" y="5" width="3" height="13"/>',
		target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
		share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5 8.6 10.5"/>',
		eyeoff: '<path d="M9.9 4.2A9.1 9.1 0 0 1 12 4c5 0 9 5 9 8a13 13 0 0 1-2 2.9M6.6 6.6C3.9 8.2 2 11 2 12c0 3 4 8 10 8a9 9 0 0 0 4.5-1.1M3 3l18 18"/>',
		filter: '<path d="M3 4h18l-7 8v6l-4 2v-8L3 4Z"/>',
		database: '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>'
	};

	const features = [
		{ icon: 'shield', title: 'Cookieless by design', body: 'No cookies, no localStorage, no fingerprinting. Visitor IDs are a daily-rotating hash — unlinkable across days. No consent banner needed.' },
		{ icon: 'zap', title: 'Featherweight script', body: 'The tracking snippet is under 1KB gzipped and loads async. It never blocks rendering or slows your site.' },
		{ icon: 'chart', title: 'One clean dashboard', body: 'Visitors, pageviews, top pages, sources, countries, devices — on a single screen. Click any row to filter everything.' },
		{ icon: 'target', title: 'Goals & custom events', body: 'Track signups, purchases, or any event with one line of JavaScript, and see completions alongside your traffic.' },
		{ icon: 'share', title: 'Public dashboards', body: 'Share a read-only, no-login link to your stats. Revoke or rotate it anytime.' },
		{ icon: 'eyeoff', title: 'Ad-blocker resilient', body: 'A neutral endpoint plus optional first-party proxy mode keeps your data flowing where generic scripts get blocked.' },
		{ icon: 'filter', title: 'Bots filtered out', body: 'Crawlers, AI scrapers, and HTTP tools are detected and excluded, so your numbers reflect real people.' },
		{ icon: 'database', title: 'Fast at any scale', body: 'Events live in ClickHouse with pre-aggregated rollups, so dashboards stay instant as your traffic grows.' }
	];
</script>

<svelte:head><title>Features · seyr</title></svelte:head>

<section class="max-w-2xl">
	<h1 class="font-display text-4xl font-semibold tracking-tight md:text-5xl">
		Everything you look at.<br />Nothing you don't.
	</h1>
	<p class="mt-4 text-lg text-muted">
		seyr surfaces the handful of metrics that actually drive decisions — fast, private, and
		clutter-free.
	</p>
</section>

<div class="mt-14 grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
	{#each features as f, i (f.title)}
		<div in:fly={{ y: 12, duration: 350, delay: i * 40 }} class="bg-surface p-6">
			<div class="grid size-9 place-items-center rounded-lg border border-border text-accent">
				<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">{@html icons[f.icon]}</svg>
			</div>
			<h3 class="mt-4 text-sm font-semibold">{f.title}</h3>
			<p class="mt-1.5 text-sm leading-relaxed text-muted">{f.body}</p>
		</div>
	{/each}
</div>

<section class="mt-14">
	<Button href="/signup" size="lg">Start free →</Button>
</section>
