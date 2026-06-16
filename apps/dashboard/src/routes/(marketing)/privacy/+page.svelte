<script lang="ts">
	import { Card } from '$lib/components/ui';

	const collect = [
		'Page URL and path',
		'Referrer source (e.g. Google, Twitter)',
		'UTM campaign tags',
		'Country (from IP, then discarded)',
		'Browser, OS, and device type',
		'A daily-rotating, anonymous visitor hash'
	];
	const never = [
		'Cookies or localStorage',
		'IP addresses (used transiently, never stored)',
		'Raw User-Agent strings',
		'Names, emails, or any personal data',
		'Cross-site or cross-day tracking',
		'Data sold or shared with third parties'
	];
</script>

<svelte:head><title>Privacy · seyr</title></svelte:head>

<section class="mx-auto max-w-2xl">
	<h1 class="font-display text-4xl font-semibold tracking-tight">Privacy first, always</h1>
	<p class="mt-3 text-muted">
		seyr is built so you can measure your website without surveilling your visitors. It's
		GDPR-, ePrivacy-, PECR-, and CCPA-friendly by design — which means no cookie banner.
	</p>

	<div class="mt-8 grid gap-4 sm:grid-cols-2">
		<Card>
			<h2 class="font-semibold text-success">What we collect</h2>
			<ul class="mt-3 flex flex-col gap-2 text-sm text-muted">
				{#each collect as item (item)}
					<li class="flex items-start gap-2"><span class="mt-0.5 text-success">✓</span>{item}</li>
				{/each}
			</ul>
		</Card>
		<Card>
			<h2 class="font-semibold text-danger">What we never do</h2>
			<ul class="mt-3 flex flex-col gap-2 text-sm text-muted">
				{#each never as item (item)}
					<li class="flex items-start gap-2"><span class="mt-0.5 text-danger">✕</span>{item}</li>
				{/each}
			</ul>
		</Card>
	</div>

	<div class="mt-10 space-y-6 text-sm leading-relaxed text-muted">
		<div>
			<h2 class="font-display text-lg font-semibold text-text">How the visitor hash works</h2>
			<p class="mt-2">
				To count unique visitors without identifying anyone, we compute a hash from a daily
				rotating salt plus the request's IP, user-agent, and your domain. The IP and user-agent are
				used only for this calculation and are immediately discarded — never written to disk. Because
				the salt rotates every 24 hours, the same person cannot be linked across days.
			</p>
		</div>
		<div>
			<h2 class="font-display text-lg font-semibold text-text">No cookie banner required</h2>
			<p class="mt-2">
				Consent banners exist because of cookies and personal-data tracking. seyr uses neither, so
				there's nothing to consent to — your visitors get a cleaner experience and you stay
				compliant.
			</p>
		</div>
		<div>
			<h2 class="font-display text-lg font-semibold text-text">Your data is yours</h2>
			<p class="mt-2">
				We don't sell, share, or mine your analytics. Export or delete your data whenever you like.
			</p>
		</div>
	</div>
</section>
