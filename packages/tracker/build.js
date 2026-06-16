import { build, context } from 'esbuild';
import { gzipSync } from 'node:zlib';
import { readFileSync } from 'node:fs';

const watch = process.argv.includes('--watch');

/** @type {import('esbuild').BuildOptions} */
const options = {
	entryPoints: ['src/tracker.ts'],
	outfile: 'dist/seyr.js',
	bundle: true,
	minify: true,
	format: 'iife',
	target: ['es2018'],
	legalComments: 'none'
};

if (watch) {
	const ctx = await context(options);
	await ctx.watch();
	console.log('[tracker] watching…');
} else {
	await build(options);
	const out = readFileSync('dist/seyr.js');
	const gz = gzipSync(out).length;
	console.log(
		`[tracker] dist/seyr.js — ${out.length} B raw, ${gz} B gzipped${gz > 1024 ? ' ⚠️ over 1KB' : ' ✓'}`
	);
}
