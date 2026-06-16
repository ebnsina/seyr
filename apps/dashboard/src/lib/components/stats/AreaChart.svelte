<script lang="ts">
	type Point = { bucket: string; visitors: number; pageviews: number };
	type Props = { points: Point[]; height?: number };
	let { points, height = 240 }: Props = $props();

	let width = $state(720);
	const pad = { top: 16, right: 8, bottom: 24, left: 8 };

	const hourly = $derived(points.some((p) => !p.bucket.endsWith('00:00:00')));
	const maxV = $derived(Math.max(1, ...points.map((p) => p.visitors)));

	const innerW = $derived(width - pad.left - pad.right);
	const innerH = $derived(height - pad.top - pad.bottom);

	function x(i: number): number {
		if (points.length <= 1) return pad.left + innerW / 2;
		return pad.left + (i / (points.length - 1)) * innerW;
	}
	function y(v: number): number {
		return pad.top + innerH - (v / maxV) * innerH;
	}

	const linePath = $derived(
		points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${y(p.visitors).toFixed(1)}`).join(' ')
	);
	const areaPath = $derived(
		points.length
			? `${linePath} L ${x(points.length - 1).toFixed(1)} ${pad.top + innerH} L ${x(0).toFixed(1)} ${pad.top + innerH} Z`
			: ''
	);

	let hover = $state<number | null>(null);

	function onMove(e: MouseEvent) {
		const rect = (e.currentTarget as SVGElement).getBoundingClientRect();
		const px = e.clientX - rect.left;
		if (points.length <= 1) {
			hover = 0;
			return;
		}
		const i = Math.round(((px - pad.left) / innerW) * (points.length - 1));
		hover = Math.max(0, Math.min(points.length - 1, i));
	}

	function fmt(bucket: string): string {
		const d = new Date(bucket.replace(' ', 'T') + 'Z');
		return hourly
			? d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric' })
			: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
	}

	// x-axis tick subset (first, last, a few between).
	const ticks = $derived(
		points.length
			? [0, Math.floor(points.length / 3), Math.floor((2 * points.length) / 3), points.length - 1]
					.filter((v, idx, arr) => arr.indexOf(v) === idx)
			: []
	);
</script>

<div class="relative w-full" bind:clientWidth={width}>
	<svg
		{width}
		{height}
		role="img"
		aria-label="Visitors over time"
		onmousemove={onMove}
		onmouseleave={() => (hover = null)}
	>
		<defs>
			<linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
				<stop offset="0%" stop-color="var(--accent)" stop-opacity="0.35" />
				<stop offset="100%" stop-color="var(--accent)" stop-opacity="0" />
			</linearGradient>
		</defs>

		{#if points.length}
			<path d={areaPath} fill="url(#areaGrad)" class="area" />
			<path
				d={linePath}
				fill="none"
				stroke="var(--accent)"
				stroke-width="2"
				stroke-linejoin="round"
				stroke-linecap="round"
				pathLength="1"
				class="line"
			/>

			{#if hover !== null}
				{@const p = points[hover]}
				<line
					x1={x(hover)}
					y1={pad.top}
					x2={x(hover)}
					y2={pad.top + innerH}
					stroke="var(--border)"
					stroke-width="1"
				/>
				<circle cx={x(hover)} cy={y(p.visitors)} r="4" fill="var(--accent)" stroke="var(--bg)" stroke-width="2" />
			{/if}

			{#each ticks as t (t)}
				<text x={x(t)} y={height - 6} fill="var(--muted)" font-size="11" text-anchor="middle">
					{fmt(points[t].bucket)}
				</text>
			{/each}
		{/if}
	</svg>

	{#if hover !== null && points[hover]}
		{@const p = points[hover]}
		<div
			class="pointer-events-none absolute top-2 z-10 -translate-x-1/2 rounded-lg border border-border bg-surface px-3 py-2 text-xs"
			style="left: {Math.min(Math.max(x(hover), 70), width - 70)}px"
		>
			<p class="font-medium">{fmt(p.bucket)}</p>
			<p class="mt-0.5 text-muted">
				<span class="font-mono font-semibold text-text">{p.visitors.toLocaleString()}</span> visitors
			</p>
			<p class="text-muted">
				<span class="font-mono font-semibold text-text">{p.pageviews.toLocaleString()}</span> views
			</p>
		</div>
	{/if}
</div>

<style>
	.line {
		stroke-dasharray: 1;
		stroke-dashoffset: 1;
		animation: draw 1100ms var(--ease-out-expo) forwards;
	}
	.area {
		opacity: 0;
		animation: fadein 900ms 300ms ease-out forwards;
	}
	@keyframes draw {
		to {
			stroke-dashoffset: 0;
		}
	}
	@keyframes fadein {
		to {
			opacity: 1;
		}
	}
</style>
