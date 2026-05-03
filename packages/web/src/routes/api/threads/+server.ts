import { findThreadBySessionId, listRecentThreads, storeThread } from '$lib/server/r2';
import { isSameGithubUser } from '$lib/server/github-identity';
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

	// Read body as text and check actual byte size
	let text: string;
	try {
		text = await event.request.text();
	} catch {
		error(400, { message: 'Could not read request body' });
	}

	if (new TextEncoder().encode(text).byteLength > MAX_THREAD_SIZE_BYTES) {
		error(413, { message: 'Thread data exceeds 10 MB limit' });
	}

	// Parse and validate
	let body: unknown;
	try {
		body = JSON.parse(text);
	} catch {
		error(400, { message: 'Invalid JSON body' });
	}

	const result = ThreadDataSchema.safeParse(body);
	if (!result.success) {
		error(400, { message: `Invalid thread data: ${result.error.message}` });
	}

	const threadData = result.data;

	// Ensure uploader matches authenticated user
	if (!isSameGithubUser({ user, uploader: threadData.uploader })) {
		error(403, { message: 'Uploader does not match authenticated user' });
	}
	if (user.githubId) {
		threadData.uploader.githubId = user.githubId;
	}

	// Reuse existing ID on re-upload, otherwise generate new one
	const bucket = event.platform!.env.THREADS_BUCKET;
	const existingId = await findThreadBySessionId({
		bucket,
		githubId: user.githubId,
		username: user.login,
		sessionId: threadData.metadata.sessionId,
		source: threadData.metadata.source
	});
	const id = existingId ?? createId();

	await storeThread({ bucket, id, data: threadData });

	const origin = new URL(event.request.url).origin;
	return json({ id, url: `${origin}/threads/${id}` }, { status: existingId ? 200 : 201 });
};
