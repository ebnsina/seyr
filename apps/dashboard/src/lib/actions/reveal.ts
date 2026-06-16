/**
 * Svelte action: fade + rise an element into view on scroll (once). Respects
 * prefers-reduced-motion. Usage: <div use:reveal> or <div use:reveal={{ delay: 80 }}>.
 */
export function reveal(node: HTMLElement, opts: { delay?: number } = {}) {
	const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
	if (reduce) return {};

	node.style.opacity = '0';
	node.style.transform = 'translateY(16px)';
	node.style.transition = `opacity 600ms cubic-bezier(0.16,1,0.3,1) ${opts.delay ?? 0}ms, transform 600ms cubic-bezier(0.16,1,0.3,1) ${opts.delay ?? 0}ms`;

	const io = new IntersectionObserver(
		(entries) => {
			for (const e of entries) {
				if (e.isIntersecting) {
					node.style.opacity = '1';
					node.style.transform = 'none';
					io.unobserve(node);
				}
			}
		},
		{ threshold: 0.12 }
	);
	io.observe(node);

	return { destroy: () => io.disconnect() };
}
