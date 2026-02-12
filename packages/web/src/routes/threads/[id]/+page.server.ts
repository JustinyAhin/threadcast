import { error } from '@sveltejs/kit';
import { getThread } from '$lib/server/r2';
import type { PageServerLoad } from './$types';

const load: PageServerLoad = async ({ params, platform }) => {
	const bucket = platform!.env.THREADS_BUCKET;
	const thread = await getThread({ bucket, id: params.id });

	if (!thread) {
		error(404, { message: 'Thread not found' });
	}

	return { thread, id: params.id };
};

export { load };
