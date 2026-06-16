<script lang="ts">
	import { fly, fade } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { Button, Badge, AnimatedNumber, Card } from '$lib/components/ui';
	import Nav from '$lib/components/marketing/Nav.svelte';
	import Footer from '$lib/components/marketing/Footer.svelte';
	import { reveal } from '$lib/actions/reveal';
	import { PLANS, formatBdt } from '$lib/billing/plans';

	// Staggered entrance helper.
	const rise = (delay: number) => ({ y: 16, duration: 700, delay, easing: cubicOut });

	// Faux live-preview bars (purely decorative).
	const bars = [38, 52, 47, 63, 58, 71, 66, 82, 78, 91, 86, 100];

	const icons: Record<string, string> = {
		shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/>',
		zap: '<path d="M13 2 3 14h9l-1 8 10-12h-9l1-8Z"/>',
		chart: '<path d="M3 3v18h18"/><rect x="7" y="12" width="3" height="6"/><rect x="12" y="8" width="3" height="10"/><rect x="17" y="5" width="3" height="13"/>',
		target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
		share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5 8.6 10.5"/>',
		eyeoff: '<path d="M9.9 4.2A9.1 9.1 0 0 1 12 4c5 0 9 5 9 8a13 13 0 0 1-2 2.9M6.6 6.6C3.9 8.2 2 11 2 12c0 3 4 8 10 8a9 9 0 0 0 4.5-1.1M3 3l18 18"/>'
	};
	const features = [
		{ icon: 'shield', title: 'Cookieless by design', body: 'No cookies, no fingerprinting, no PII. Nothing to consent to — drop the banner.' },
		{ icon: 'zap', title: 'Under 1KB', body: 'A featherweight async script that never slows your pages down.' },
		{ icon: 'chart', title: 'One clean screen', body: 'Visitors, pages, sources, devices. Click any row to filter everything.' },
		{ icon: 'target', title: 'Goals & events', body: 'Track signups and purchases with a single line of JavaScript.' },
		{ icon: 'share', title: 'Public dashboards', body: 'Share a read-only link to your stats — no login required.' },
		{ icon: 'eyeoff', title: 'Ad-blocker resilient', body: 'Neutral endpoint + first-party proxy mode keeps data flowing.' }
	];
	const steps = [
		['Add the snippet', 'Paste one <script> tag into your site’s <head>. That’s the whole install.'],
		['Watch it land', 'Your dashboard flips to “receiving data” the moment the first visit arrives.'],
		['Read the numbers', 'Visitors, top pages, sources, goals — on a single fast, private screen.']
	];
</script>

<svelte:head>
	<title>seyr — privacy-first web analytics</title>
	<meta
		name="description"
		content="Clean, cookieless web analytics. No banner, no PII, no clutter — just the numbers that matter."
	/>
</svelte:head>

<div class="relative min-h-dvh overflow-hidden bg-bg">
	<!-- ambient backdrop -->
	<div class="bg-grid pointer-events-none absolute inset-0 opacity-[0.18]"></div>
	<div
		class="pointer-events-none absolute -top-48 left-1/2 size-[560px] -translate-x-1/2 rounded-full opacity-[0.1] blur-[130px]"
		style="background: radial-gradient(circle, var(--accent), transparent 60%)"
	></div>

	<div class="relative mx-auto flex max-w-6xl flex-col px-6">
		<Nav />

		<!-- hero -->
		<section class="grid items-center gap-12 py-16 md:grid-cols-2 md:py-24">
			<div class="flex flex-col items-start gap-6">
				{#if true}
					<div in:fly={rise(80)}>
						<Badge tone="accent">
							<span class="size-1.5 rounded-full bg-accent"></span>
							Cookieless · GDPR-friendly · no banner
						</Badge>
					</div>
					<h1
						class="font-display text-balance text-5xl font-semibold leading-[1.05] tracking-tight md:text-6xl"
						in:fly={rise(160)}
					>
						Web analytics<br />without the <span class="text-accent">clutter</span>.
					</h1>
					<p class="max-w-md text-pretty text-lg text-muted" in:fly={rise(240)}>
						Everything you actually look at in Google Analytics — visitors, pages, sources — on one
						fast, beautiful screen. No cookies, no personal data, ever.
					</p>
					<div class="flex flex-wrap items-center gap-3" in:fly={rise(320)}>
						<Button href="/signup" size="lg">Start free →</Button>
						<Button href="/login" variant="outline" size="lg">Live demo</Button>
					</div>
					<p class="text-sm text-muted" in:fade={{ delay: 460, duration: 600 }}>
						Free up to 10k monthly events. No credit card.
					</p>
				{/if}
			</div>

			<!-- faux dashboard preview -->
			<div in:fly={{ x: 24, duration: 800, delay: 300, easing: cubicOut }}>
				<div
					class="rounded-2xl border border-border bg-surface/80 p-5 backdrop-blur-sm"
				>
					<div class="mb-4 flex items-center justify-between">
						<div>
							<p class="text-xs text-muted">Unique visitors · 30d</p>
							<p class="font-mono text-3xl font-semibold">
								<AnimatedNumber value={48217} />
							</p>
						</div>
						<Badge tone="success">▲ 12.4%</Badge>
					</div>
					<div class="flex h-40 items-end gap-1.5">
						{#each bars as h, i (i)}
							<div
								class="flex-1 rounded-t bg-gradient-to-t from-accent/40 to-accent"
								style="height: {h}%; animation: grow 700ms {300 + i * 60}ms both var(--ease-out-expo)"
							></div>
						{/each}
					</div>
					<div class="mt-4 grid grid-cols-3 gap-3 text-center">
						{#each [['Pages', '12.1k'], ['Sources', '328'], ['Countries', '74']] as [label, val] (label)}
							<div class="rounded-lg bg-surface-2 py-2">
								<p class="font-mono text-sm font-semibold">{val}</p>
								<p class="text-xs text-muted">{label}</p>
							</div>
						{/each}
					</div>
				</div>
			</div>
		</section>

		<!-- features -->
		<section class="py-16">
			<div use:reveal class="max-w-xl">
				<h2 class="font-display text-3xl font-semibold tracking-tight">
					Everything you look at. Nothing you don't.
				</h2>
				<p class="mt-3 text-muted">The metrics that drive decisions — fast, private, clutter-free.</p>
			</div>
			<div class="mt-8 grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
				{#each features as f (f.title)}
					<div use:reveal class="bg-surface p-6">
						<div class="grid size-9 place-items-center rounded-lg border border-border text-accent">
							<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">{@html icons[f.icon]}</svg>
						</div>
						<h3 class="mt-4 text-sm font-semibold">{f.title}</h3>
						<p class="mt-1.5 text-sm leading-relaxed text-muted">{f.body}</p>
					</div>
				{/each}
			</div>
			<div use:reveal class="mt-4">
				<a href="/features" class="text-sm font-medium text-accent hover:underline">All features →</a>
			</div>
		</section>

		<!-- how it works -->
		<section class="py-16">
			<h2 use:reveal class="font-display text-3xl font-semibold tracking-tight">
				Live in two minutes
			</h2>
			<div class="mt-8 grid gap-6 sm:grid-cols-3">
				{#each steps as [title, body], i (title)}
					<div use:reveal={{ delay: i * 80 }}>
						<div class="font-mono text-sm text-accent">0{i + 1}</div>
						<h3 class="mt-2 font-semibold">{title}</h3>
						<p class="mt-1 text-sm text-muted">{body}</p>
					</div>
				{/each}
			</div>
		</section>

		<!-- pricing preview -->
		<section class="py-16">
			<div use:reveal class="flex items-end justify-between">
				<h2 class="font-display text-3xl font-semibold tracking-tight">Pricing in taka</h2>
				<a href="/pricing" class="text-sm font-medium text-accent hover:underline">Full pricing →</a>
			</div>
			<div class="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				{#each PLANS as plan, i (plan.tier)}
					<div use:reveal={{ delay: i * 60 }}>
						<Card class="flex h-full flex-col {plan.popular ? 'ring-1 ring-accent' : ''}">
							{#if plan.popular}<Badge tone="accent" class="mb-2 self-start">Popular</Badge>{/if}
							<p class="font-display text-lg font-semibold">{plan.name}</p>
							<p class="mt-3 font-mono text-2xl font-semibold">
								{plan.priceBdt === 0 ? 'Free' : formatBdt(plan.priceBdt)}
								{#if plan.priceBdt > 0}<span class="text-xs font-normal text-muted">/mo</span>{/if}
							</p>
							<p class="mt-2 text-sm text-muted">{plan.eventLimit.toLocaleString()} events/mo</p>
							<Button href="/signup" variant={plan.popular ? 'primary' : 'outline'} size="sm" class="mt-4 w-full">
								{plan.priceBdt === 0 ? 'Start free' : 'Choose'}
							</Button>
						</Card>
					</div>
				{/each}
			</div>
		</section>

		<!-- privacy band -->
		<section use:reveal class="py-16">
			<div class="rounded-2xl border border-border bg-surface p-8 sm:p-12">
				<Badge tone="accent">Privacy first</Badge>
				<h2 class="mt-4 font-display text-3xl font-semibold tracking-tight">
					Measure your site. Don't surveil your visitors.
				</h2>
				<p class="mt-3 max-w-lg text-muted">
					seyr never uses cookies, never stores personal data, and never tracks people across sites
					or days. IP and user-agent are used once to derive geo and a daily hash, then discarded.
				</p>
				<a href="/privacy" class="mt-4 inline-block text-sm font-medium text-accent hover:underline">
					Read our privacy approach →
				</a>
			</div>
		</section>

		<!-- closing CTA -->
		<section class="pb-24">
			<div
				class="relative overflow-hidden rounded-2xl border border-border bg-surface px-8 py-14 text-center"
			>
				<div
					class="pointer-events-none absolute inset-x-0 -top-24 mx-auto size-72 rounded-full opacity-[0.1] blur-[110px]"
					style="background: radial-gradient(circle, var(--accent), transparent 60%)"
				></div>
				<h2 class="font-display text-3xl font-semibold tracking-tight">
					Ready to ditch the clutter?
				</h2>
				<p class="mx-auto mt-2 max-w-md text-muted">
					Set up in two minutes. Free up to 10k events a month — no credit card.
				</p>
				<div class="mt-6 flex justify-center gap-3">
					<Button href="/signup" size="lg">Start free →</Button>
					<Button href="/pricing" variant="outline" size="lg">See pricing</Button>
				</div>
			</div>
		</section>

		<Footer />
	</div>
</div>

<style>
	@keyframes grow {
		from {
			transform: scaleY(0);
			transform-origin: bottom;
			opacity: 0;
		}
		to {
			transform: scaleY(1);
			opacity: 1;
		}
	}
</style>
