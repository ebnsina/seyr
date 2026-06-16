<script lang="ts">
	import { Button, Logo, ThemeToggle } from '$lib/components/ui';

	const links = [
		{ href: '/features', label: 'Features' },
		{ href: '/pricing', label: 'Pricing' },
		{ href: '/docs', label: 'Docs' }
	];
</script>

<header class="flex items-center justify-between py-6">
	<a href="/" aria-label="seyr home"><Logo /></a>

	<nav class="flex items-center gap-1">
		{#each links as link (link.href)}
			<a
				href={link.href}
				class="hidden rounded-lg px-3 py-1.5 text-sm font-medium text-muted transition-colors hover:text-text sm:block"
			>
				{link.label}
			</a>
		{/each}
		<div class="ml-1"><ThemeToggle /></div>
		<Button href="/login" variant="ghost" size="sm">Log in</Button>
		<Button href="/signup" size="sm">Get started</Button>
	</nav>
</header>
