<script lang="ts">
	import { fly, fade } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { Button, Badge, AnimatedNumber } from '$lib/components/ui';
	import Nav from '$lib/components/marketing/Nav.svelte';
	import Footer from '$lib/components/marketing/Footer.svelte';

	// Staggered entrance helper.
	const rise = (delay: number) => ({ y: 16, duration: 700, delay, easing: cubicOut });

	// Faux live-preview bars (purely decorative).
	const bars = [38, 52, 47, 63, 58, 71, 66, 82, 78, 91, 86, 100];
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

		<!-- feature strip -->
		<section class="grid gap-4 pb-24 sm:grid-cols-3" in:fade={{ delay: 500, duration: 700 }}>
			{#each [['No cookies', 'No consent banner, no fingerprinting, no PII stored.'], ['Lightweight', 'A <1KB script that never slows your site down.'], ['Instant insight', 'One clean dashboard. Click any row to filter everything.']] as [title, body] (title)}
				<div class="rounded-xl border border-border bg-surface/60 p-5">
					<h3 class="font-semibold">{title}</h3>
					<p class="mt-1 text-sm text-muted">{body}</p>
				</div>
			{/each}
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
