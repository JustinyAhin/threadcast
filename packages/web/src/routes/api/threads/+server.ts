import { listRecentThreads, storeThread } from '$lib/server/r2';
import { resolveUser } from '$lib/server/resolve-user';
import { createId } from '@paralleldrive/cuid2';
import { error, json } from '@sveltejs/kit';
import { MAX_THREAD_SIZE_BYTES, ThreadDataSchema } from '@threadcast/shared';

export const GET = async ({ platform }) => {
	const bucket = platform!.env.THREADS_BUCKET;
	const threads = await listRecentThreads(bucket);
	return json(threads);
};

export const POST = async (event) => {
	const user = await resolveUser(event);
	if (!user) {
		error(401, { message: 'Authentication required' });
	}

	// Size check
	const contentLength = event.request.headers.get('content-length');
	if (contentLength && parseInt(contentLength) > MAX_THREAD_SIZE_BYTES) {
		error(413, { message: 'Thread data exceeds 10 MB limit' });
	}

	// Parse and validate
	let body: unknown;
	try {
		body = await event.request.json();
	} catch {
		error(400, { message: 'Invalid JSON body' });
	}

	const result = ThreadDataSchema.safeParse(body);
	if (!result.success) {
		error(400, { message: `Invalid thread data: ${result.error.message}` });
	}

	const threadData = result.data;

	// Ensure uploader matches authenticated user
	if (threadData.uploader.githubUsername !== user.login) {
		error(403, { message: 'Uploader does not match authenticated user' });
	}

	// Generate ID and store
	const id = createId();
	const bucket = event.platform!.env.THREADS_BUCKET;
	await storeThread({ bucket, id, data: threadData });

	return json({ id, url: `https://threadcast.dev/threads/${id}` }, { status: 201 });
};
