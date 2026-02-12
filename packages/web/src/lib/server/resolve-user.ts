import type { RequestEvent } from '@sveltejs/kit';

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

	// 2. Check Bearer token (CLI)
	const authHeader = event.request.headers.get('authorization');
	if (authHeader?.startsWith('Bearer ')) {
		const token = authHeader.slice(7);
		const res = await fetch('https://api.github.com/user', {
			headers: {
				Authorization: `Bearer ${token}`,
				Accept: 'application/vnd.github+json',
				'User-Agent': 'ThreadCast/1.0'
			}
		});

		if (!res.ok) return null;
		const ghUser = (await res.json()) as { login: string; avatar_url: string };
		return { login: ghUser.login, avatarUrl: ghUser.avatar_url };
	}

	return null;
};

export { resolveUser, type ResolvedUser };
