<script lang="ts">
	import { fly } from 'svelte/transition';
	import { Card, Badge, Button } from '$lib/components/ui';
	import { PLANS, formatBdt } from '$lib/billing/plans';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const usagePct = $derived(
		data.limit > 0 ? Math.min(100, Math.round((data.usage / data.limit) * 100)) : 0
	);
	const over = $derived(data.usage > data.limit);
	const currentTier = $derived(data.subscription?.plan ?? 'free');

	const periodEnd = $derived(
		data.subscription?.currentPeriodEnd
			? new Date(data.subscription.currentPeriodEnd).toLocaleDateString(undefined, {
					year: 'numeric',
					month: 'short',
					day: 'numeric'
				})
			: null
	);
</script>

<svelte:head><title>Billing · seyr</title></svelte:head>

<h1 class="font-display text-2xl font-semibold tracking-tight">Billing</h1>
<p class="mt-1 text-sm text-muted">Manage your plan and usage. Payments in BDT via SSLCommerz.</p>

<!-- current plan + usage -->
<Card class="mt-6">
	<div class="flex flex-wrap items-start justify-between gap-4">
		<div>
			<div class="flex items-center gap-2">
				<span class="font-display text-lg font-semibold">{data.planName} plan</span>
				<Badge tone={currentTier === 'free' ? 'muted' : 'accent'}>{data.subscription?.status ?? 'active'}</Badge>
			</div>
			{#if periodEnd}
				<p class="mt-1 text-sm text-muted">
					{data.subscription?.autoRenew ? 'Renews' : 'Expires'} on {periodEnd}
				</p>
			{/if}
		</div>
	</div>

	<div class="mt-5">
		<div class="mb-1.5 flex items-center justify-between text-sm">
			<span class="text-muted">Events this month</span>
			<span class="font-mono">
				{data.usage.toLocaleString()} / {data.limit.toLocaleString()}
			</span>
		</div>
		<div class="h-2.5 overflow-hidden rounded-full bg-surface-2">
			<div
				class="h-full rounded-full transition-[width] duration-700 ease-out {over
					? 'bg-danger'
					: 'bg-accent'}"
				style="width: {usagePct}%"
			></div>
		</div>
		{#if over}
			<p class="mt-2 text-sm text-danger">
				You're over your monthly limit. Upgrade to keep collecting accurate data.
			</p>
		{/if}
	</div>
</Card>

<!-- plan grid -->
<h2 class="mt-10 font-display text-lg font-semibold">Plans</h2>
<div class="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
							<span class="mt-0.5 text-accent">✓</span>
							<span class="text-muted">{f}</span>
						</li>
					{/each}
				</ul>
				<div class="mt-5">
					{#if plan.tier === currentTier}
						<Button variant="outline" class="w-full" disabled>Current plan</Button>
					{:else if plan.tier === 'free'}
						<Button variant="ghost" class="w-full" disabled>—</Button>
					{:else}
						<form method="POST" action="/billing/checkout">
							<input type="hidden" name="plan" value={plan.tier} />
							<Button type="submit" class="w-full">
								{plan.priceBdt > (PLANS.find((p) => p.tier === currentTier)?.priceBdt ?? 0)
									? 'Upgrade'
									: 'Switch'}
							</Button>
						</form>
					{/if}
				</div>
			</Card>
		</div>
	{/each}
</div>
