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
	class="rounded-xl border border-border bg-surface p-5 shadow-sm
		{interactive
		? 'transition-[transform,box-shadow,border-color] duration-300 ease-out hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-[0_12px_40px_-18px_var(--accent)]'
		: ''}
		{klass}"
>
	{@render children()}
</div>
