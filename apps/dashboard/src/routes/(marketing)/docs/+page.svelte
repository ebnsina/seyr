<script lang="ts">
	import { Card } from '$lib/components/ui';

	const snippet = `<script defer data-domain="example.com"
  src="https://cdn.seyr.app/seyr.js"><\/script>`;
	const eventCode = `seyr('event', 'Signup', { plan: 'growth' });`;
	const excludeCode = `<script defer data-domain="example.com"
  data-exclude="/admin/**,/preview"
  src="https://cdn.seyr.app/seyr.js"><\/script>`;
</script>

<svelte:head><title>Docs · seyr</title></svelte:head>

<section class="mx-auto max-w-2xl">
	<h1 class="font-display text-4xl font-semibold tracking-tight">Documentation</h1>
	<p class="mt-3 text-muted">Get up and running in about two minutes.</p>

	<div class="mt-8 space-y-8">
		<div>
			<h2 class="font-display text-xl font-semibold">1. Add the snippet</h2>
			<p class="mt-2 text-sm text-muted">
				Paste this into the <code class="rounded bg-surface-2 px-1 font-mono text-xs">&lt;head&gt;</code>
				of your site, replacing the domain with yours.
			</p>
			<pre class="mt-3 overflow-x-auto rounded-lg border border-border bg-surface-2 p-4 font-mono text-xs leading-relaxed"><code>{snippet}</code></pre>
			<p class="mt-2 text-xs text-muted">
				That's it — pageviews (including SPA route changes) are tracked automatically. No cookies,
				no banner.
			</p>
		</div>

		<div>
			<h2 class="font-display text-xl font-semibold">2. Verify it works</h2>
			<p class="mt-2 text-sm text-muted">
				Open your site, then watch your seyr dashboard — the site flips to “receiving data” as soon
				as the first event arrives. The install screen polls for it automatically.
			</p>
		</div>

		<div>
			<h2 class="font-display text-xl font-semibold">3. Track custom events</h2>
			<p class="mt-2 text-sm text-muted">Fire a goal or conversion from anywhere in your JS:</p>
			<pre class="mt-3 overflow-x-auto rounded-lg border border-border bg-surface-2 p-4 font-mono text-xs"><code>{eventCode}</code></pre>
			<p class="mt-2 text-xs text-muted">
				They show up under “Goals &amp; Custom Events” with completion counts.
			</p>
		</div>

		<div>
			<h2 class="font-display text-xl font-semibold">4. Exclude paths (optional)</h2>
			<p class="mt-2 text-sm text-muted">Skip admin or preview routes with a glob list:</p>
			<pre class="mt-3 overflow-x-auto rounded-lg border border-border bg-surface-2 p-4 font-mono text-xs"><code>{excludeCode}</code></pre>
		</div>

		<Card class="bg-accent-soft/40">
			<h2 class="font-semibold">Beating ad-blockers (proxy mode)</h2>
			<p class="mt-2 text-sm text-muted">
				The script and beacon use a neutral path, but for maximum capture you can serve seyr from
				your own domain. Proxy <code class="rounded bg-surface-2 px-1 font-mono text-xs">/seyr.js</code>
				and the beacon path through your CDN or edge (Cloudflare, Vercel, Nginx) — first-party
				requests aren't blocked. The script auto-targets whatever origin it's served from, so no
				code change is needed.
			</p>
		</Card>
	</div>
</section>
