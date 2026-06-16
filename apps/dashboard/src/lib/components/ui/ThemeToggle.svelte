<script lang="ts">
	import { onMount } from 'svelte';

	let dark = $state(true);

	onMount(() => {
		const stored = localStorage.getItem('seyr-theme');
		dark = stored ? stored === 'dark' : document.documentElement.classList.contains('dark');
		apply();
	});

	function apply() {
		document.documentElement.classList.toggle('dark', dark);
		localStorage.setItem('seyr-theme', dark ? 'dark' : 'light');
	}

	function toggle() {
		dark = !dark;
		apply();
	}
</script>

<button
	onclick={toggle}
	class="focus-ring grid size-9 place-items-center rounded-lg text-muted transition-colors hover:bg-surface-2 hover:text-text"
	aria-label="Toggle theme"
	title="Toggle theme"
>
	{#if dark}
		<!-- moon -->
		<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
		</svg>
	{:else}
		<!-- sun -->
		<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<circle cx="12" cy="12" r="4" />
			<path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
		</svg>
	{/if}
</button>
