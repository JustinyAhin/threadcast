import { listRecentThreads, listUserThreads } from '$lib/server/r2';
import type { PageServerLoad } from './$types';

const load: PageServerLoad = async ({ platform, locals }) => {
	const bucket = platform!.env.THREADS_BUCKET;
	const recentThreads = await listRecentThreads(bucket);

	if (locals.user?.githubUsername) {
		const userThreads = await listUserThreads({
			bucket,
			username: locals.user.githubUsername
		});
		const privateThreads = userThreads.filter(
			(t) =>
				t.metadata.visibility === 'private' &&
				!recentThreads.some((r) => r.id === t.id)
		);
		const merged = [...privateThreads, ...recentThreads].sort(
			(a, b) => new Date(b.metadata.created).getTime() - new Date(a.metadata.created).getTime()
		);
		return { threads: merged };
	}

	return { threads: recentThreads };
};

export { load };
