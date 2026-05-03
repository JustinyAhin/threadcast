import { getThread, getThreadMeta, mergeThreadMeta } from '$lib/server/r2';
import { isSameGithubUser } from '$lib/server/github-identity';
import { resolveUser } from '$lib/server/resolve-user';
import { error, json } from '@sveltejs/kit';

// Used by naps-og to render /og/threadcast/threads/:id.png images.
export const GET = async (event) => {
	const bucket = event.platform!.env.THREADS_BUCKET;
	const meta = await getThreadMeta({ bucket, id: event.params.id });
	if (!meta) {
		error(404, { message: 'Thread not found' });
	}

	if (meta.metadata.visibility === 'private') {
		const user = await resolveUser(event);
		if (!user || !isSameGithubUser({ user, uploader: meta.uploader })) {
			error(404, { message: 'Thread not found' });
		}
	}

	const storedThread = await getThread({ bucket, id: event.params.id });
	if (!storedThread) {
		error(404, { message: 'Thread not found' });
	}
	const thread = mergeThreadMeta({ thread: storedThread, meta });
	return json(thread);
};
