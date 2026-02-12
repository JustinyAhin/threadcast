type GitHubUser = {
	login: string;
	avatar_url: string;
};

const verifyGitHubToken = async (token: string): Promise<GitHubUser | null> => {
	const res = await fetch('https://api.github.com/user', {
		headers: {
			Authorization: `Bearer ${token}`,
			Accept: 'application/vnd.github+json',
			'User-Agent': 'ThreadCast/1.0'
		}
	});

	if (!res.ok) return null;
	const user = (await res.json()) as GitHubUser;
	return user;
};

export { verifyGitHubToken, type GitHubUser };
