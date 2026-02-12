import { listUserThreads } from '$lib/server/r2';
import type { PageServerLoad } from './$types';

const load: PageServerLoad = async ({ params, platform, locals }) => {
	const bucket = platform!.env.THREADS_BUCKET;
	const allThreads = await listUserThreads({ bucket, username: params.username });

	const isOwner = locals.user?.githubUsername === params.username;
	const threads = isOwner
		? allThreads
		: allThreads.filter((t) => t.metadata.visibility === 'public');

	return { threads, username: params.username };
};

export { load };
