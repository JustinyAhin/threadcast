import { getDb } from '$lib/server/db';
import { createLocalAuthCode } from '$lib/server/local-auth';
import { error, redirect } from '@sveltejs/kit';

const isAllowedCallback = (value: string): boolean => {
	try {
		const url = new URL(value);
		return url.protocol === 'http:' && url.hostname === '127.0.0.1';
	} catch {
		return false;
	}
};

export const GET = async (event) => {
	const callback = event.url.searchParams.get('callback');
	const state = event.url.searchParams.get('state');

	if (!callback || !state || !isAllowedCallback(callback)) {
		error(400, { message: 'Invalid local login callback' });
	}

	if (!event.locals.user) {
		const next = `${event.url.pathname}${event.url.search}`;
		redirect(302, `/login?callbackURL=${encodeURIComponent(next)}`);
	}

	const githubUsername = event.locals.user.githubUsername;
	if (!githubUsername) {
		error(400, { message: 'GitHub account is required' });
	}

	const code = await createLocalAuthCode({
		db: getDb(event.platform!.env.AUTH_DB),
		userId: event.locals.user.id,
		githubUsername,
		githubAvatarUrl: event.locals.user.image ?? ''
	});

	const redirectUrl = new URL(callback);
	redirectUrl.searchParams.set('code', code);
	redirectUrl.searchParams.set('state', state);
	redirect(302, redirectUrl.toString());
};
