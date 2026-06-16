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

<div class="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
	{#each PLANS as plan, i (plan.tier)}
		<div in:fly={{ y: 14, duration: 400, delay: i * 60 }}>
			<Card class="flex h-full flex-col {plan.popular ? 'ring-1 ring-accent' : ''}">
				{#if plan.popular}
					<Badge tone="accent" class="mb-2 self-start">Most popular</Badge>
				{/if}
				<p class="font-display text-lg font-semibold">{plan.name}</p>
				<p class="mt-1 text-sm text-muted">{plan.tagline}</p>
				<p class="mt-4 font-mono text-3xl font-semibold">
					{plan.priceBdt === 0 ? 'Free' : formatBdt(plan.priceBdt)}
					{#if plan.priceBdt > 0}<span class="text-sm font-normal text-muted">/mo</span>{/if}
				</p>
				<ul class="mt-4 flex flex-1 flex-col gap-2 text-sm">
					{#each plan.features as f (f)}
						<li class="flex items-start gap-2">
							<span class="mt-0.5 text-accent">✓</span><span class="text-muted">{f}</span>
						</li>
					{/each}
				</ul>
				<Button href="/signup" variant={plan.popular ? 'primary' : 'outline'} class="mt-5 w-full">
					{plan.priceBdt === 0 ? 'Start free' : 'Choose ' + plan.name}
				</Button>
			</Card>
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
