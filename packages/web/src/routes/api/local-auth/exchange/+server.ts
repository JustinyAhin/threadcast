import { getDb } from '$lib/server/db';
import { exchangeLocalAuthCode } from '$lib/server/local-auth';
import { enforceRateLimit } from '$lib/server/rate-limit';
import { error, json } from '@sveltejs/kit';

export const POST = async (event) => {
	await enforceRateLimit({
		event,
		limiter: event.platform!.env.LOCAL_AUTH_EXCHANGE_LIMITER,
		name: 'local-auth-exchange'
	});

	const body = (await event.request.json().catch(() => null)) as { code?: unknown } | null;
	const code = typeof body?.code === 'string' ? body.code : '';
	if (!code) {
		error(400, { message: 'Code is required' });
	}

	const auth = await exchangeLocalAuthCode({
		db: getDb(event.platform!.env.AUTH_DB),
		code
	});
	if (!auth) {
		error(400, { message: 'Invalid or expired local login code' });
	}

	return json({
		token: auth.token,
		githubId: auth.githubId,
		githubUsername: auth.githubUsername,
		githubAvatarUrl: auth.githubAvatarUrl,
		expiresAt: auth.expiresAt
	});
};
