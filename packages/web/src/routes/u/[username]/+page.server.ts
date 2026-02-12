import { listUserThreads } from '$lib/server/r2';
import type { PageServerLoad } from './$types';

const load: PageServerLoad = async ({ params, platform }) => {
	const bucket = platform!.env.THREADS_BUCKET;
	const threads = await listUserThreads({ bucket, username: params.username });
	return { threads, username: params.username };
};

export { load };
