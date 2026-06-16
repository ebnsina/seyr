<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';

	type Props = {
		label?: string;
		error?: string;
		class?: string;
		value?: string;
	} & HTMLInputAttributes;

	let {
		label,
		error,
		class: klass = '',
		value = $bindable(''),
		id,
		...rest
	}: Props = $props();

	const inputId = id ?? `in-${Math.random().toString(36).slice(2, 9)}`;
</script>

<div class="flex flex-col gap-1.5">
	{#if label}
		<label for={inputId} class="text-sm font-medium text-text">{label}</label>
	{/if}
	<input
		id={inputId}
		bind:value
		class="focus-ring h-10 rounded-lg border bg-surface-2 px-3 text-sm text-text placeholder:text-muted/70
			transition-colors duration-150
			{error ? 'border-danger' : 'border-border hover:border-muted/50'}
			{klass}"
		{...rest}
	/>
	{#if error}
		<span class="text-xs text-danger">{error}</span>
	{/if}
</div>
