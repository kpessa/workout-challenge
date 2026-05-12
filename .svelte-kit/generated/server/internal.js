
import root from '../root.svelte';
import { set_building, set_prerendering } from '__sveltekit/environment';
import { set_assets } from '__sveltekit/paths';
import { set_manifest, set_read_implementation } from '__sveltekit/server';
import { set_private_env, set_public_env, set_safe_public_env } from '../../../node_modules/.pnpm/@sveltejs+kit@2.22.2_@sveltejs+vite-plugin-svelte@3.1.2_svelte@4.2.20_vite@5.4.19_@type_aa45b94cfd896cb91459dc3690eb2250/node_modules/@sveltejs/kit/src/runtime/shared-server.js';

export const options = {
	app_template_contains_nonce: false,
	csp: {"mode":"auto","directives":{"upgrade-insecure-requests":false,"block-all-mixed-content":false},"reportOnly":{"upgrade-insecure-requests":false,"block-all-mixed-content":false}},
	csrf_check_origin: true,
	embedded: false,
	env_public_prefix: 'PUBLIC_',
	env_private_prefix: '',
	hash_routing: false,
	hooks: null, // added lazily, via `get_hooks`
	preload_strategy: "modulepreload",
	root,
	service_worker: false,
	templates: {
		app: ({ head, body, assets, nonce, env }) => "<!DOCTYPE html>\n<html lang=\"en\">\n\t<head>\n\t\t<meta charset=\"utf-8\" />\n\t\t<link rel=\"icon\" href=\"" + assets + "/favicon.ico\" />\n\t\t<link rel=\"stylesheet\" href=\"https://rsms.me/inter/inter.css\">\n\t\t\n\t\t<!-- Enhanced viewport for mobile -->\n\t\t<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0, viewport-fit=cover, user-scalable=no\" />\n\t\t\n\t\t<!-- PWA Manifest -->\n\t\t<link rel=\"manifest\" href=\"" + assets + "/manifest.webmanifest\" />\n\t\t\n\t\t<!-- iOS Safari Meta Tags for Native App Experience -->\n\t\t<meta name=\"mobile-web-app-capable\" content=\"yes\" />\n\t\t<meta name=\"apple-mobile-web-app-status-bar-style\" content=\"default\" />\n\t\t<meta name=\"apple-mobile-web-app-title\" content=\"90-Day Challenge\" />\n\t\t\n\t\t<!-- Theme Colors -->\n\t\t<meta name=\"theme-color\" content=\"#22c55e\" />\n\t\t<meta name=\"theme-color\" media=\"(prefers-color-scheme: dark)\" content=\"#16a34a\" />\n\t\t<meta name=\"msapplication-TileColor\" content=\"#22c55e\" />\n\t\t\n\t\t<!-- iOS Dark Mode Support -->\n\t\t<style>\n\t\t\t/* Force dark mode for date and time inputs on iOS */\n\t\t\tinput[type=\"date\"], input[type=\"time\"], input[type=\"datetime-local\"] {\n\t\t\t\tcolor-scheme: dark light;\n\t\t\t}\n\t\t\t@media (prefers-color-scheme: dark) {\n\t\t\t\tinput[type=\"date\"], input[type=\"time\"], input[type=\"datetime-local\"] {\n\t\t\t\t\tcolor-scheme: dark;\n\t\t\t\t}\n\t\t\t}\n\t\t</style>\n\t\t\n\t\t<!-- Apple Touch Icons -->\n\t\t<link rel=\"apple-touch-icon\" href=\"" + assets + "/apple-touch-icon.png\" />\n\t\t\n\t\t<!-- Standard Icons -->\n\t\t<link rel=\"icon\" type=\"image/png\" sizes=\"32x32\" href=\"" + assets + "/favicon-32x32.png\" />\n\t\t<link rel=\"icon\" type=\"image/png\" sizes=\"16x16\" href=\"" + assets + "/favicon-16x16.png\" />\n\t\t\n\t\t<meta name=\"google-site-verification\" content=\"qhYR2muQVK5NoZ8a5QS7yHpS8qAIkZXNTlapsZTPqz0\" />\n\t\t" + head + "\n\t</head>\n\t<body data-sveltekit-preload-data=\"hover\">\n\t\t<div style=\"display: contents\">" + body + "</div>\n\t</body>\n</html> ",
		error: ({ status, message }) => "<!doctype html>\n<html lang=\"en\">\n\t<head>\n\t\t<meta charset=\"utf-8\" />\n\t\t<title>" + message + "</title>\n\n\t\t<style>\n\t\t\tbody {\n\t\t\t\t--bg: white;\n\t\t\t\t--fg: #222;\n\t\t\t\t--divider: #ccc;\n\t\t\t\tbackground: var(--bg);\n\t\t\t\tcolor: var(--fg);\n\t\t\t\tfont-family:\n\t\t\t\t\tsystem-ui,\n\t\t\t\t\t-apple-system,\n\t\t\t\t\tBlinkMacSystemFont,\n\t\t\t\t\t'Segoe UI',\n\t\t\t\t\tRoboto,\n\t\t\t\t\tOxygen,\n\t\t\t\t\tUbuntu,\n\t\t\t\t\tCantarell,\n\t\t\t\t\t'Open Sans',\n\t\t\t\t\t'Helvetica Neue',\n\t\t\t\t\tsans-serif;\n\t\t\t\tdisplay: flex;\n\t\t\t\talign-items: center;\n\t\t\t\tjustify-content: center;\n\t\t\t\theight: 100vh;\n\t\t\t\tmargin: 0;\n\t\t\t}\n\n\t\t\t.error {\n\t\t\t\tdisplay: flex;\n\t\t\t\talign-items: center;\n\t\t\t\tmax-width: 32rem;\n\t\t\t\tmargin: 0 1rem;\n\t\t\t}\n\n\t\t\t.status {\n\t\t\t\tfont-weight: 200;\n\t\t\t\tfont-size: 3rem;\n\t\t\t\tline-height: 1;\n\t\t\t\tposition: relative;\n\t\t\t\ttop: -0.05rem;\n\t\t\t}\n\n\t\t\t.message {\n\t\t\t\tborder-left: 1px solid var(--divider);\n\t\t\t\tpadding: 0 0 0 1rem;\n\t\t\t\tmargin: 0 0 0 1rem;\n\t\t\t\tmin-height: 2.5rem;\n\t\t\t\tdisplay: flex;\n\t\t\t\talign-items: center;\n\t\t\t}\n\n\t\t\t.message h1 {\n\t\t\t\tfont-weight: 400;\n\t\t\t\tfont-size: 1em;\n\t\t\t\tmargin: 0;\n\t\t\t}\n\n\t\t\t@media (prefers-color-scheme: dark) {\n\t\t\t\tbody {\n\t\t\t\t\t--bg: #222;\n\t\t\t\t\t--fg: #ddd;\n\t\t\t\t\t--divider: #666;\n\t\t\t\t}\n\t\t\t}\n\t\t</style>\n\t</head>\n\t<body>\n\t\t<div class=\"error\">\n\t\t\t<span class=\"status\">" + status + "</span>\n\t\t\t<div class=\"message\">\n\t\t\t\t<h1>" + message + "</h1>\n\t\t\t</div>\n\t\t</div>\n\t</body>\n</html>\n"
	},
	version_hash: "1hnb3hw"
};

export async function get_hooks() {
	let handle;
	let handleFetch;
	let handleError;
	let init;
	({ handle, handleFetch, handleError, init } = await import("../../../src/hooks.server.ts"));

	let reroute;
	let transport;
	

	return {
		handle,
		handleFetch,
		handleError,
		init,
		reroute,
		transport
	};
}

export { set_assets, set_building, set_manifest, set_prerendering, set_private_env, set_public_env, set_read_implementation, set_safe_public_env };
