<script lang="ts">
	import { Logo } from '$lib/components/ui';

	const cols = [
		{ title: 'Product', links: [['Features', '/features'], ['Pricing', '/pricing'], ['Docs', '/docs']] },
		{ title: 'Company', links: [['Privacy', '/privacy'], ['Log in', '/login'], ['Get started', '/signup']] }
	] as const;
</script>

<footer class="mt-24 border-t border-border py-12">
	<div class="flex flex-col justify-between gap-10 sm:flex-row">
		<div class="max-w-xs">
			<Logo />
			<p class="mt-3 text-sm text-muted">
				Privacy-first, cookieless web analytics. The numbers that matter — without the clutter.
			</p>
		</div>

		<div class="flex gap-16">
			{#each cols as col (col.title)}
				<div>
					<h4 class="text-sm font-semibold">{col.title}</h4>
					<ul class="mt-3 flex flex-col gap-2">
						{#each col.links as [label, href] (href)}
							<li>
								<a href={href} class="text-sm text-muted transition-colors hover:text-text">{label}</a>
							</li>
						{/each}
					</ul>
				</div>
			{/each}
		</div>
	</div>

	<p class="mt-10 text-xs text-muted">
		© {new Date().getFullYear()} seyr · No cookies, no personal data, no banner.
	</p>
</footer>
