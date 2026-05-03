import { getDb } from '$lib/server/db';
import { createLocalAuthCode } from '$lib/server/local-auth';
import { resolveUser } from '$lib/server/resolve-user';
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

	if (!callback || !state || state.length > 256 || !isAllowedCallback(callback)) {
		error(400, { message: 'Invalid local login callback' });
	}

	if (!event.locals.user) {
		const next = `${event.url.pathname}${event.url.search}`;
		redirect(302, `/login?callbackURL=${encodeURIComponent(next)}`);
	}

	const githubUser = await resolveUser(event);
	if (!githubUser) {
		error(400, { message: 'GitHub account is required' });
	}

	const code = await createLocalAuthCode({
		db: getDb(event.platform!.env.AUTH_DB),
		userId: event.locals.user.id,
		githubId: githubUser.githubId,
		githubUsername: githubUser.login,
		githubAvatarUrl: event.locals.user.image ?? ''
	});

	const redirectUrl = new URL(callback);
	redirectUrl.searchParams.set('code', code);
	redirectUrl.searchParams.set('state', state);
	redirect(302, redirectUrl.toString());
};
