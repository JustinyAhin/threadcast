import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, type Plugin } from 'vite';

const cloudflareDevProxy = (): Plugin => ({
	name: 'cloudflare-workers-dev-proxy',
	apply: 'serve',
	resolveId(id) {
		if (id === 'cloudflare:workers') {
			return '\0cloudflare:workers';
		}
	},
	load(id) {
		if (id === '\0cloudflare:workers') {
			return [
				'import { getPlatformProxy } from "wrangler";',
				'const proxy = await getPlatformProxy();',
				'export const env = proxy.env;'
			].join('\n');
		}
	}
});

export default defineConfig({
	build: {
		rollupOptions: {
			external: ['cloudflare:workers']
		}
	},
	plugins: [cloudflareDevProxy(), tailwindcss(), sveltekit()]
});
