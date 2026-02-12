import { error } from '@sveltejs/kit';
import { getThread, getThreadMeta } from '$lib/server/r2';
import type { PageServerLoad } from './$types';

const load: PageServerLoad = async ({ params, platform, locals }) => {
	const bucket = platform!.env.THREADS_BUCKET;
	const meta = await getThreadMeta({ bucket, id: params.id });

	if (!meta) {
		error(404, { message: 'Thread not found' });
	}

	if (meta.metadata.visibility === 'private') {
		if (locals.user?.githubUsername !== meta.uploader.githubUsername) {
			error(404, { message: 'Thread not found' });
		}
	}

	const thread = await getThread({ bucket, id: params.id });
	if (!thread) {
		error(404, { message: 'Thread not found' });
	}

	return { thread, id: params.id };
};

export { load };
