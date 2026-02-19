import type { Handle } from '@sveltejs/kit';
import { building } from '$app/environment';
import { json } from '@sveltejs/kit';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import { auth } from '$lib/server/auth';

const MUTATION_METHODS = new Set(['POST', 'PATCH', 'DELETE']);
const CORS_METHODS = 'GET, POST, PATCH, DELETE, OPTIONS';
const CORS_HEADERS = 'Authorization, Content-Type';

const handle: Handle = async ({ event, resolve }) => {
	if (building) {
		event.locals.user = null;
		event.locals.session = null;
		return resolve(event);
	}

	const { pathname } = event.url;

	// CORS: handle preflight and set headers for API routes
	if (pathname.startsWith('/api/')) {
		const origin = event.request.headers.get('origin');
		const allowedOrigin = origin === event.url.origin ? origin : null;

		if (event.request.method === 'OPTIONS') {
			return new Response(null, {
				status: 204,
				headers: {
					...(allowedOrigin && { 'Access-Control-Allow-Origin': allowedOrigin }),
					'Access-Control-Allow-Methods': CORS_METHODS,
					'Access-Control-Allow-Headers': CORS_HEADERS,
					'Access-Control-Max-Age': '86400'
				}
			});
		}

		// Rate limit mutation requests
		if (MUTATION_METHODS.has(event.request.method)) {
			const ip = event.request.headers.get('cf-connecting-ip') ?? '127.0.0.1';
			const rateLimiter = event.platform?.env.MUTATION_RATE_LIMITER;
			if (rateLimiter) {
				const { success } = await rateLimiter.limit({ key: ip });
				if (!success) {
					return json({ error: 'Too many requests' }, { status: 429 });
				}
			}
		}
	}

	const sessionData = await auth.api.getSession({
		headers: event.request.headers
	});

	event.locals.user = sessionData?.user ?? null;
	event.locals.session = sessionData?.session ?? null;

	return svelteKitHandler({ event, resolve, auth, building });
};

export { handle };
