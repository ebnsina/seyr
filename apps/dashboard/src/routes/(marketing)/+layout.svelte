<script lang="ts">
	import type { Snippet } from 'svelte';
	import Nav from '$lib/components/marketing/Nav.svelte';
	import Footer from '$lib/components/marketing/Footer.svelte';

	let { children }: { children: Snippet } = $props();
</script>

<div class="relative min-h-dvh overflow-hidden bg-bg">
	<div class="bg-grid pointer-events-none absolute inset-0 opacity-[0.14]"></div>
	<div class="relative mx-auto max-w-6xl px-6">
		<Nav />
		<main class="py-10">
			{@render children()}
		</main>
		<Footer />
	</div>
</div>
