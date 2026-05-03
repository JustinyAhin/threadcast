import { listOwnedThreads, listRecentThreads } from '$lib/server/r2';
import { resolveUser } from '$lib/server/resolve-user';

export const load = async (event) => {
	const { platform, locals } = event;
	const bucket = platform!.env.THREADS_BUCKET;

	if (locals.user?.githubUsername) {
		const user = await resolveUser(event);
		const threads = await listOwnedThreads({
			bucket,
			githubId: user?.githubId,
			username: locals.user.githubUsername
		});
		return { threads };
	}

	const threads = await listRecentThreads(bucket);
	return { threads };
};
