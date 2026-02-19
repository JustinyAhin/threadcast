import type { RequestEvent } from '@sveltejs/kit';

type ResolvedUser = {
	login: string;
	avatarUrl: string;
};

type CacheEntry = {
	user: ResolvedUser;
	expires: number;
};

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const tokenCache = new Map<string, CacheEntry>();

const hashToken = async (token: string): Promise<string> => {
	const data = new TextEncoder().encode(token);
	const hash = await crypto.subtle.digest('SHA-256', data);
	return Array.from(new Uint8Array(hash))
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('');
};

const evictExpired = () => {
	const now = Date.now();
	for (const [key, entry] of tokenCache) {
		if (entry.expires <= now) {
			tokenCache.delete(key);
		}
	}
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

	// 2. Check Bearer token (CLI) with caching
	const authHeader = event.request.headers.get('authorization');
	if (authHeader?.startsWith('Bearer ')) {
		const token = authHeader.slice(7);
		const cacheKey = await hashToken(token);

		evictExpired();

		const cached = tokenCache.get(cacheKey);
		if (cached && cached.expires > Date.now()) {
			return cached.user;
		}

		const res = await fetch('https://api.github.com/user', {
			headers: {
				Authorization: `Bearer ${token}`,
				Accept: 'application/vnd.github+json',
				'User-Agent': 'ThreadCast/1.0'
			}
		});

		if (!res.ok) return null;
		const ghUser = (await res.json()) as { login: string; avatar_url: string };
		const user: ResolvedUser = { login: ghUser.login, avatarUrl: ghUser.avatar_url };

		tokenCache.set(cacheKey, { user, expires: Date.now() + CACHE_TTL_MS });

		return user;
	}

	return null;
};

export { resolveUser, type ResolvedUser };
