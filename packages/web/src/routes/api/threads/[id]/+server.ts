import { deleteThread, getThread, getThreadMeta } from '$lib/server/r2';
import { resolveUser } from '$lib/server/resolve-user';
import { error, json } from '@sveltejs/kit';

export const GET = async ({ params, platform }) => {
	const bucket = platform!.env.THREADS_BUCKET;
	const thread = await getThread({ bucket, id: params.id });
	if (!thread) {
		error(404, { message: 'Thread not found' });
	}
	return json(thread);
};

export const DELETE = async (event) => {
	const user = await resolveUser(event);
	if (!user) {
		error(401, { message: 'Authentication required' });
	}

	const bucket = event.platform!.env.THREADS_BUCKET;

	// Check ownership
	const meta = await getThreadMeta({ bucket, id: event.params.id });
	if (!meta) {
		error(404, { message: 'Thread not found' });
	}
	if (meta.uploader.githubUsername !== user.login) {
		error(403, { message: 'You can only delete your own threads' });
	}

	await deleteThread({ bucket, id: event.params.id });
	return json({ deleted: true });
};
