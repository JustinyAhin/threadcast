import { listRecentThreads } from '$lib/server/r2';
import type { PageServerLoad } from './$types';

const load: PageServerLoad = async ({ platform }) => {
	const bucket = platform!.env.THREADS_BUCKET;
	const threads = await listRecentThreads(bucket);
	return { threads };
};

export { load };
