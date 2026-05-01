import type { RequestEvent } from '@sveltejs/kit';
import { validateLocalAuthToken } from './local-auth';

type ResolvedUser = {
	login: string;
	avatarUrl: string;
};

const resolveUser = async (event: RequestEvent): Promise<ResolvedUser | null> => {
	// 1. Check web session (Better Auth)
	const localUser = event.locals.user;
	if (localUser?.githubUsername) {
		return {
			login: localUser.githubUsername,
			avatarUrl: localUser.image ?? ''
		};
	}

	// 2. Check ThreadCast local client bearer token
	const authHeader = event.request.headers.get('authorization');
	if (authHeader?.startsWith('Bearer ')) {
		const token = authHeader.slice(7);
		const localUser = await validateLocalAuthToken(token);
		if (!localUser) return null;
		return {
			login: localUser.githubUsername,
			avatarUrl: localUser.githubAvatarUrl
		};
	}

	return null;
};

export { resolveUser, type ResolvedUser };
