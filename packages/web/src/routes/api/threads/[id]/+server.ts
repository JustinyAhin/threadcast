import { deleteThread, getThread, getThreadMeta, updateThreadVisibility } from '$lib/server/r2';
import { resolveUser } from '$lib/server/resolve-user';
import { error, json } from '@sveltejs/kit';
import { MAX_THREAD_SIZE_BYTES } from '@threadcast/shared';

export const GET = async (event) => {
	const bucket = event.platform!.env.THREADS_BUCKET;
	const meta = await getThreadMeta({ bucket, id: event.params.id });
	if (!meta) {
		error(404, { message: 'Thread not found' });
	}

	if (meta.metadata.visibility === 'private') {
		const user = await resolveUser(event);
		if (!user || user.login !== meta.uploader.githubUsername) {
			error(404, { message: 'Thread not found' });
		}
	}

	const thread = await getThread({ bucket, id: event.params.id });
	if (!thread) {
		error(404, { message: 'Thread not found' });
	}
	return json(thread);
};

export const PATCH = async (event) => {
	const user = await resolveUser(event);
	if (!user) {
		error(401, { message: 'Authentication required' });
	}

	const bucket = event.platform!.env.THREADS_BUCKET;
	const meta = await getThreadMeta({ bucket, id: event.params.id });
	if (!meta) {
		error(404, { message: 'Thread not found' });
	}
	if (meta.uploader.githubUsername !== user.login) {
		error(403, { message: 'You can only update your own threads' });
	}

	let text: string;
	try {
		text = await event.request.text();
	} catch {
		error(400, { message: 'Could not read request body' });
	}

	if (new TextEncoder().encode(text).byteLength > MAX_THREAD_SIZE_BYTES) {
		error(413, { message: 'Request body exceeds 10 MB limit' });
	}

	let body: { visibility?: string };
	try {
		body = JSON.parse(text);
	} catch {
		error(400, { message: 'Invalid JSON body' });
	}

	const visibility = body.visibility;
	if (visibility !== 'public' && visibility !== 'private') {
		error(400, { message: 'visibility must be "public" or "private"' });
	}

	await updateThreadVisibility({ bucket, id: event.params.id, visibility });
	return json({ visibility });
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
