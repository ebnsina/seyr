<script lang="ts">
	import { Tween } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';

	type Props = { value: number; duration?: number; format?: (n: number) => string; class?: string };
	let { value, duration = 900, format = (n) => Math.round(n).toLocaleString(), class: klass = '' }: Props =
		$props();

	const tween = new Tween(0, { duration, easing: cubicOut });

	// Re-target the tween whenever the incoming value changes (e.g. on filter).
	$effect(() => {
		tween.target = value;
	});
</script>

<span class={klass}>{format(tween.current)}</span>
