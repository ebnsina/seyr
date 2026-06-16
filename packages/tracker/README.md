# @seyr/tracker

The embeddable browser script. Built to `dist/seyr.js` (~0.8KB gzipped).

```bash
pnpm --filter @seyr/tracker build   # one-off
pnpm --filter @seyr/tracker dev     # watch
```

## What it does

- Sends a `pageview` on load and on SPA route changes (patches `pushState`/
  `replaceState`, listens for `popstate`).
- Uses `navigator.sendBeacon` (falls back to `fetch` keepalive) so events survive
  page unload.
- **No cookies, no localStorage, no fingerprinting.** The visitor hash is computed
  server-side and rotates daily.
- Honors Do-Not-Track, skips `localhost`/`file:`/prerenders, and a
  `localStorage.seyr_ignore = 'true'` opt-out.

## Config (script-tag attributes)

| attribute      | required | meaning                                                       |
| -------------- | -------- | ------------------------------------------------------------- |
| `data-domain`  | yes      | the registered site domain (e.g. `example.com`)              |
| `data-host`    | no       | override beacon origin; defaults to the script's own origin   |
| `data-exclude` | no       | comma-separated path globs to skip (e.g. `/admin/**,/draft`)  |

Because the beacon defaults to the **script's own origin**, first-party "proxy mode"
(serving `seyr.js` from the customer's domain) works with no extra config and avoids
ad-blocker domain rules. See [`snippet.html`](./snippet.html) for the embed code.

## Custom events

```js
seyr('event', 'Signup', { plan: 'growth' });
```
