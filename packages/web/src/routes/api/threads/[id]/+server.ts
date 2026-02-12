import { json, error } from '@sveltejs/kit';
import { verifyGitHubToken } from '$lib/server/auth';
import { getThread, getThreadMeta, deleteThread } from '$lib/server/r2';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, platform }) => {
	const bucket = platform!.env.THREADS_BUCKET;
	const thread = await getThread(bucket, params.id);
	if (!thread) {
		error(404, { message: 'Thread not found' });
	}
	return json(thread);
};

export const DELETE: RequestHandler = async ({ params, request, platform }) => {
	// Auth
	const authHeader = request.headers.get('authorization');
	if (!authHeader?.startsWith('Bearer ')) {
		error(401, { message: 'Missing authorization token' });
	}

	const token = authHeader.slice(7);
	const user = await verifyGitHubToken(token);
	if (!user) {
		error(401, { message: 'Invalid GitHub token' });
	}

	const bucket = platform!.env.THREADS_BUCKET;

	// Check ownership
	const meta = await getThreadMeta(bucket, params.id);
	if (!meta) {
		error(404, { message: 'Thread not found' });
	}
	if (meta.uploader.githubUsername !== user.login) {
		error(403, { message: 'You can only delete your own threads' });
	}

	await deleteThread(bucket, params.id);
	return json({ deleted: true });
};
