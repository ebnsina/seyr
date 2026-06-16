<script lang="ts">
	import type { Snippet } from 'svelte';
	import { fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { Logo, ThemeToggle } from '$lib/components/ui';

	let { children }: { children: Snippet } = $props();
</script>

<div class="relative grid min-h-dvh place-items-center overflow-hidden bg-bg px-6">
	<div class="bg-grid pointer-events-none absolute inset-0 opacity-30"></div>
	<div
		class="pointer-events-none absolute -top-40 left-1/2 size-[520px] -translate-x-1/2 rounded-full opacity-20 blur-[120px]"
		style="background: radial-gradient(circle, var(--accent), transparent 60%)"
	></div>

	<header class="absolute inset-x-0 top-0 flex items-center justify-between p-6">
		<a href="/"><Logo /></a>
		<ThemeToggle />
	</header>

	<div class="relative w-full max-w-sm" in:fly={{ y: 18, duration: 600, easing: cubicOut }}>
		{@render children()}
	</div>
</div>
