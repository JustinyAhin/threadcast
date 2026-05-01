import { issueLocalAuthToken } from '$lib/server/local-auth';
import { error, json } from '@sveltejs/kit';

type GitHubUser = {
	login: string;
	avatar_url: string;
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

export const POST = async (event) => {
	const body = (await event.request.json().catch(() => null)) as { githubToken?: unknown } | null;
	const githubToken = typeof body?.githubToken === 'string' ? body.githubToken : '';
	if (!githubToken) {
		error(400, { message: 'GitHub token is required' });
	}

	const user = await getGitHubUser(githubToken);
	if (!user) {
		error(401, { message: 'Invalid GitHub token' });
	}

	const auth = await issueLocalAuthToken({
		githubUsername: user.login,
		githubAvatarUrl: user.avatar_url
	});

	return json({
		token: auth.token,
		githubUsername: auth.githubUsername,
		githubAvatarUrl: auth.githubAvatarUrl,
		expiresAt: auth.expiresAt
	});
};
