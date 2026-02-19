import { getThread, getThreadMeta } from '$lib/server/r2';
import { error } from '@sveltejs/kit';

export const load = async ({ params, platform, locals }) => {
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

	const isOwner = locals.user?.githubUsername === meta.uploader.githubUsername;

	return { thread, id: params.id, isOwner };
};
