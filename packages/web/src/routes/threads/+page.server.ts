import { listRecentThreads, listUserThreads } from '$lib/server/r2';

export const load = async ({ platform, locals }) => {
	const bucket = platform!.env.THREADS_BUCKET;

	if (locals.user?.githubUsername) {
		const threads = await listUserThreads({
			bucket,
			username: locals.user.githubUsername
		});
		return { threads };
	}

	const threads = await listRecentThreads(bucket);
	return { threads };
};
