import type { Handle } from '@sveltejs/kit';
import { building } from '$app/environment';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import { auth } from '$lib/server/auth';

const handle: Handle = async ({ event, resolve }) => {
	if (building) {
		event.locals.user = null;
		event.locals.session = null;
		return resolve(event);
	}

	const sessionData = await auth.api.getSession({
		headers: event.request.headers
	});

	event.locals.user = sessionData?.user ?? null;
	event.locals.session = sessionData?.session ?? null;

	return svelteKitHandler({ event, resolve, auth, building });
};

export { handle };
