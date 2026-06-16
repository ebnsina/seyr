<script lang="ts">
	import type { Snippet } from 'svelte';

	type Tone = 'accent' | 'muted' | 'success' | 'danger';
	type Props = { tone?: Tone; class?: string; children: Snippet };

	let { tone = 'muted', class: klass = '', children }: Props = $props();

	const tones: Record<Tone, string> = {
		accent: 'bg-accent-soft text-accent',
		muted: 'bg-surface-2 text-muted',
		success: 'bg-success/15 text-success',
		danger: 'bg-danger/15 text-danger'
	};
</script>

<span
	class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium {tones[
		tone
	]} {klass}"
>
	{@render children()}
</span>
