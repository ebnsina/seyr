<script lang="ts">
	import type { Snippet } from 'svelte';

	type Props = {
		class?: string;
		/** Adds an accent glow + lift on hover (for interactive cards). */
		interactive?: boolean;
		children: Snippet;
	};

	let { class: klass = '', interactive = false, children }: Props = $props();
</script>

<div
	class="rounded-xl border border-border bg-surface p-5
		{interactive
		? 'transition-[transform,border-color] duration-300 ease-out hover:-translate-y-0.5 hover:border-accent/50'
		: ''}
		{klass}"
>
	{@render children()}
</div>
