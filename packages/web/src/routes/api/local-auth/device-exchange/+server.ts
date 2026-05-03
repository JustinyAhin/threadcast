import { getDb } from '$lib/server/db';
import { ensureGithubUser, issueLocalAuthToken } from '$lib/server/local-auth';
import { enforceRateLimit } from '$lib/server/rate-limit';
import { error, json } from '@sveltejs/kit';

type GitHubUser = {
	id: number;
	login: string;
	avatar_url: string;
};

type GitHubEmail = {
	email: string;
	primary: boolean;
	verified: boolean;
};

const getGitHubUser = async (token: string): Promise<GitHubUser | null> => {
	const res = await fetch('https://api.github.com/user', {
		headers: {
			Authorization: `Bearer ${token}`,
			Accept: 'application/vnd.github+json',
			'User-Agent': 'ThreadCast/1.0'
		}
	});
	if (!res.ok) return null;
	return (await res.json()) as GitHubUser;
};

const getGitHubEmail = async (token: string): Promise<string | null> => {
	const res = await fetch('https://api.github.com/user/emails', {
		headers: {
			Authorization: `Bearer ${token}`,
			Accept: 'application/vnd.github+json',
			'User-Agent': 'ThreadCast/1.0'
		}
	});

	if (!res.ok) return null;

	const emails = (await res.json()) as GitHubEmail[];
	return emails.find((email) => email.primary && email.verified)?.email ?? null;
};

export const POST = async (event) => {
	await enforceRateLimit({
		event,
		limiter: event.platform!.env.LOCAL_AUTH_DEVICE_EXCHANGE_LIMITER,
		name: 'local-auth-device-exchange'
	});

	const body = (await event.request.json().catch(() => null)) as { githubToken?: unknown } | null;
	const githubToken = typeof body?.githubToken === 'string' ? body.githubToken : '';
	if (!githubToken) {
		error(400, { message: 'GitHub token is required' });
	}

	const user = await getGitHubUser(githubToken);
	if (!user) {
		error(401, { message: 'Invalid GitHub token' });
	}

	const db = getDb(event.platform!.env.AUTH_DB);
	const localUser = await ensureGithubUser({
		db,
		githubId: String(user.id),
		githubUsername: user.login,
		githubAvatarUrl: user.avatar_url,
		email: await getGitHubEmail(githubToken)
	});

	const auth = await issueLocalAuthToken({
		db,
		...localUser
	});

	return json({
		token: auth.token,
		githubId: auth.githubId,
		githubUsername: auth.githubUsername,
		githubAvatarUrl: auth.githubAvatarUrl,
		expiresAt: auth.expiresAt
	});
};
