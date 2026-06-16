<script lang="ts">
	type Props = { size?: number; class?: string; withText?: boolean };
	let { size = 28, class: klass = '', withText = true }: Props = $props();
</script>

<span class="inline-flex items-center gap-2 {klass}">
	<svg
		width={size}
		height={size}
		viewBox="0 0 32 32"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
		aria-hidden="true"
	>
		<rect width="32" height="32" rx="9" fill="var(--accent)" />
		<!-- three rising bars — the "analytics pulse" mark -->
		<rect x="8" y="17" width="3.5" height="7" rx="1.75" fill="var(--accent-fg)" opacity="0.65" />
		<rect x="14.25" y="12" width="3.5" height="12" rx="1.75" fill="var(--accent-fg)" opacity="0.85" />
		<rect x="20.5" y="8" width="3.5" height="16" rx="1.75" fill="var(--accent-fg)" />
	</svg>
	{#if withText}
		<span class="font-display text-xl font-semibold tracking-tight text-text">seyr</span>
	{/if}
</span>
