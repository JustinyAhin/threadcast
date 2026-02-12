import { json, error } from '@sveltejs/kit';
import { ThreadDataSchema, MAX_THREAD_SIZE_BYTES } from '@threadcast/shared';
import { verifyGitHubToken } from '$lib/server/auth';
import { storeThread, listRecentThreads } from '$lib/server/r2';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ platform }) => {
	const bucket = platform!.env.THREADS_BUCKET;
	const threads = await listRecentThreads(bucket);
	return json(threads);
};

export const POST: RequestHandler = async ({ request, platform }) => {
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

	// Size check
	const contentLength = request.headers.get('content-length');
	if (contentLength && parseInt(contentLength) > MAX_THREAD_SIZE_BYTES) {
		error(413, { message: 'Thread data exceeds 10 MB limit' });
	}

	// Parse and validate
	let body: unknown;
	try {
		body = await request.json();
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
	const id = generateId();
	const bucket = platform!.env.THREADS_BUCKET;
	await storeThread(bucket, id, threadData);

	return json({ id, url: `https://threadcast.dev/threads/${id}` }, { status: 201 });
};

function generateId(): string {
	const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
	let id = '';
	const bytes = crypto.getRandomValues(new Uint8Array(8));
	for (const b of bytes) {
		id += chars[b % chars.length];
	}
	return id;
}
