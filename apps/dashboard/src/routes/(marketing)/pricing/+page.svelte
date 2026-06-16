<script lang="ts">
	import { fly } from 'svelte/transition';
	import { Card, Badge, Button } from '$lib/components/ui';
	import { PLANS, formatBdt } from '$lib/billing/plans';

	const faqs = [
		['Do I need a cookie banner?', 'No. seyr is cookieless and stores no personal data, so you do not need a consent banner under GDPR/ePrivacy.'],
		['What counts as an event?', 'A pageview or a custom event you send. Bots and crawlers are filtered out and never counted.'],
		['Can I change plans later?', 'Yes — upgrade or downgrade anytime. Paid plans are billed in BDT via SSLCommerz (cards, bKash, Nagad, Rocket).'],
		['What happens if I exceed my plan?', 'We keep showing your data and prompt you to upgrade. We never sell your data or surprise-bill you.']
	];
</script>

<svelte:head><title>Pricing · seyr</title></svelte:head>

<section class="text-center">
	<h1 class="font-display text-4xl font-semibold tracking-tight md:text-5xl">
		Simple pricing, in taka
	</h1>
	<p class="mx-auto mt-3 max-w-md text-muted">
		Start free. Upgrade when you grow. No per-seat fees, no hidden costs.
	</p>
</section>

<div class="mt-12 grid items-stretch gap-5 pt-3 md:grid-cols-2 lg:grid-cols-4">
	{#each PLANS as plan, i (plan.tier)}
		<div in:fly={{ y: 14, duration: 400, delay: i * 60 }} class="h-full">
			<div
				class="relative flex h-full flex-col rounded-2xl border p-6
					{plan.popular
					? 'border-accent bg-accent-soft/15 lg:-mt-3 lg:pb-9'
					: 'border-border bg-surface'}"
			>
				{#if plan.popular}
					<div class="absolute -top-3 left-1/2 -translate-x-1/2">
						<Badge tone="accent">Most popular</Badge>
					</div>
				{/if}

				<p class="font-display text-lg font-semibold">{plan.name}</p>
				<p class="mt-1 min-h-[2.5rem] text-sm text-muted">{plan.tagline}</p>

				<div class="mt-5 flex items-baseline gap-1.5">
					<span class="font-display text-4xl font-semibold tracking-tight">
						{plan.priceBdt === 0 ? 'Free' : formatBdt(plan.priceBdt)}
					</span>
					{#if plan.priceBdt > 0}<span class="text-sm text-muted">/month</span>{/if}
				</div>

				<Button href="/signup" variant={plan.popular ? 'primary' : 'outline'} class="mt-6 w-full">
					{plan.priceBdt === 0 ? 'Start free' : 'Get ' + plan.name}
				</Button>

				<div class="my-6 h-px bg-border"></div>

				<ul class="flex flex-1 flex-col gap-3 text-sm">
					{#each plan.features as f (f)}
						<li class="flex items-start gap-2.5">
							<svg class="mt-0.5 shrink-0 text-accent" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
							<span class="text-muted">{f}</span>
						</li>
					{/each}
				</ul>
			</div>
		</div>
	{/each}
</div>

<section class="mx-auto mt-20 max-w-2xl">
	<h2 class="text-center font-display text-2xl font-semibold tracking-tight">
		Frequently asked
	</h2>
	<div class="mt-6 flex flex-col gap-3">
		{#each faqs as [q, a] (q)}
			<details class="group rounded-xl border border-border bg-surface p-5">
				<summary class="flex cursor-pointer items-center justify-between font-medium">
					{q}
					<span class="text-muted transition-transform group-open:rotate-45">+</span>
				</summary>
				<p class="mt-2 text-sm text-muted">{a}</p>
			</details>
		{/each}
	</div>
</section>
