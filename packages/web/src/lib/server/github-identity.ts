import type { Uploader } from '@threadcast/shared';

type ResolvedGithubUser = {
	githubId?: string;
	login: string;
	avatarUrl: string;
};

const isSameGithubUser = (opts: { user: ResolvedGithubUser; uploader: Uploader }): boolean => {
	if (opts.uploader.githubId) {
		return opts.user.githubId === opts.uploader.githubId;
	}

	return opts.user.login === opts.uploader.githubUsername;
};

export { isSameGithubUser, type ResolvedGithubUser };
