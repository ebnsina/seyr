<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes, HTMLAnchorAttributes } from 'svelte/elements';

	type Variant = 'primary' | 'outline' | 'ghost' | 'danger';
	type Size = 'sm' | 'md' | 'lg';

	type Props = {
		variant?: Variant;
		size?: Size;
		loading?: boolean;
		href?: string;
		class?: string;
		children: Snippet;
	} & HTMLButtonAttributes &
		HTMLAnchorAttributes;

	let {
		variant = 'primary',
		size = 'md',
		loading = false,
		href,
		class: klass = '',
		children,
		...rest
	}: Props = $props();

	const base =
		'relative inline-flex items-center justify-center gap-2 rounded-lg font-medium select-none focus-ring ' +
		'transition-[transform,background-color,border-color,box-shadow] duration-150 ease-out ' +
		'active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none';

	const variants: Record<Variant, string> = {
		primary:
			'bg-accent text-accent-fg hover:bg-accent-hover shadow-[0_4px_20px_-6px_var(--accent)] hover:shadow-[0_6px_28px_-6px_var(--accent)]',
		outline: 'border border-border bg-surface text-text hover:bg-surface-2',
		ghost: 'text-muted hover:text-text hover:bg-surface-2',
		danger: 'bg-danger text-white hover:opacity-90'
	};

	const sizes: Record<Size, string> = {
		sm: 'h-8 px-3 text-sm',
		md: 'h-10 px-4 text-sm',
		lg: 'h-12 px-6 text-base'
	};

	const cls = $derived(`${base} ${variants[variant]} ${sizes[size]} ${klass}`);
</script>

{#if href}
	<a {href} class={cls} {...rest}>
		{@render children()}
	</a>
{:else}
	<button class={cls} disabled={loading || (rest as HTMLButtonAttributes).disabled} {...rest}>
		{#if loading}
			<span
				class="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
			></span>
		{/if}
		{@render children()}
	</button>
{/if}
