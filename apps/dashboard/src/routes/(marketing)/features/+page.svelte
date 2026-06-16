<script lang="ts">
	import { fly } from 'svelte/transition';
	import { Card, Button } from '$lib/components/ui';

	const features = [
		{ icon: '🍪', title: 'Cookieless by design', body: 'No cookies, no localStorage, no fingerprinting. Visitor IDs are a daily-rotating hash — unlinkable across days. No consent banner needed.' },
		{ icon: '⚡', title: 'Featherweight script', body: 'The tracking snippet is under 1KB gzipped and loads async. It never blocks rendering or slows your site.' },
		{ icon: '📊', title: 'One clean dashboard', body: 'Visitors, pageviews, top pages, sources, countries, devices — on a single screen. Click any row to filter everything.' },
		{ icon: '🎯', title: 'Goals & custom events', body: 'Track signups, purchases, or any event with one line: seyr("event", "Signup"). See completions alongside your traffic.' },
		{ icon: '🔗', title: 'Public dashboards', body: 'Share a read-only, no-login link to your stats. Revoke or rotate it anytime.' },
		{ icon: '🛡️', title: 'Ad-blocker resilient', body: 'A neutral endpoint plus optional first-party proxy mode keeps your data flowing where generic scripts get blocked.' },
		{ icon: '🤖', title: 'Bots filtered out', body: 'Crawlers, AI scrapers, and HTTP tools are detected and excluded, so your numbers reflect real people.' },
		{ icon: '🌍', title: 'Fast at any scale', body: 'Events live in ClickHouse with pre-aggregated rollups, so dashboards stay instant as your traffic grows.' }
	];
</script>

<svelte:head><title>Features · seyr</title></svelte:head>

<section class="text-center">
	<h1 class="font-display text-4xl font-semibold tracking-tight md:text-5xl">
		Everything you look at.<br />Nothing you don't.
	</h1>
	<p class="mx-auto mt-3 max-w-lg text-muted">
		seyr gives you the handful of metrics that actually drive decisions — fast, private, and
		clutter-free.
	</p>
</section>

<div class="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
	{#each features as f, i (f.title)}
		<div in:fly={{ y: 14, duration: 400, delay: i * 50 }}>
			<Card interactive class="h-full">
				<div class="text-2xl">{f.icon}</div>
				<h3 class="mt-3 font-semibold">{f.title}</h3>
				<p class="mt-1 text-sm text-muted">{f.body}</p>
			</Card>
		</div>
	{/each}
</div>

<section class="mt-16 text-center">
	<Button href="/signup" size="lg">Start free →</Button>
</section>
