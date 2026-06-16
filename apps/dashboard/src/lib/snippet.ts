/**
 * Build the embed snippet a customer pastes into their site's <head>. The beacon
 * endpoint is derived by the tracker from the script's own origin, so this also
 * documents first-party proxy mode (serve the script from your own domain).
 */
export function buildSnippet(scriptHost: string, domain: string): string {
	return `<script defer data-domain="${domain}" src="${scriptHost}/seyr.js"></script>`;
}
