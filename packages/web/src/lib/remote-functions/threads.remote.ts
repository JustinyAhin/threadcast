import { isSameGithubUser } from '$lib/server/github-identity';
import {
	getThread,
	getThreadMeta,
	getThreadView,
	mergeThreadMeta,
	mergeThreadViewMeta,
	storeThreadView,
	updateThreadVisibility
} from '$lib/server/r2';
import { resolveUser } from '$lib/server/resolve-user';
import {
	createFullThreadToolCall,
	createThreadViewData,
	findThreadTool,
	sliceThreadViewData
} from '$lib/server/thread-view-data';
import { command, getRequestEvent, query } from '$app/server';
import { error } from '@sveltejs/kit';
import { z } from 'zod';

const SetThreadVisibilitySchema = z.object({
	id: z.string().min(1),
	visibility: z.enum(['public', 'private'])
});

const GetThreadToolPayloadSchema = z.object({
	threadId: z.string().min(1),
	toolId: z.string().min(1)
});

const GetThreadTurnsSchema = z.object({
	threadId: z.string().min(1),
	offset: z.number().int().min(0),
	limit: z.number().int().min(1).max(100)
});

const getAuthorizedThreadView = async (threadId: string) => {
	const event = getRequestEvent();
	const bucket = event.platform!.env.THREADS_BUCKET;
	const meta = await getThreadMeta({ bucket, id: threadId });
	if (!meta) {
		error(404, { message: 'Thread not found' });
	}

	if (meta.metadata.visibility === 'private') {
		const user = await resolveUser(event);
		if (!user || !isSameGithubUser({ user, uploader: meta.uploader })) {
			error(404, { message: 'Thread not found' });
		}
	}

	const cachedView = await getThreadView({ bucket, id: threadId });
	if (cachedView) {
		return mergeThreadViewMeta({ thread: cachedView, meta });
	}

	const storedThread = await getThread({ bucket, id: threadId });
	if (!storedThread) {
		error(404, { message: 'Thread not found' });
	}

	const thread = createThreadViewData(mergeThreadMeta({ thread: storedThread, meta }));
	event.platform?.ctx.waitUntil(storeThreadView({ bucket, id: threadId, thread }));
	return thread;
};

const setThreadVisibility = command(SetThreadVisibilitySchema, async ({ id, visibility }) => {
	const event = getRequestEvent();
	const user = await resolveUser(event);
	if (!user) {
		error(401, { message: 'Authentication required' });
	}

	const bucket = event.platform!.env.THREADS_BUCKET;
	const meta = await getThreadMeta({ bucket, id });
	if (!meta) {
		error(404, { message: 'Thread not found' });
	}
	if (!isSameGithubUser({ user, uploader: meta.uploader })) {
		error(403, { message: 'You can only update your own threads' });
	}

	await updateThreadVisibility({ bucket, id, visibility, meta });
	return { visibility };
});

const getThreadToolPayload = query(GetThreadToolPayloadSchema, async ({ threadId, toolId }) => {
	const event = getRequestEvent();
	const bucket = event.platform!.env.THREADS_BUCKET;
	const meta = await getThreadMeta({ bucket, id: threadId });
	if (!meta) {
		error(404, { message: 'Thread not found' });
	}
	if (meta.metadata.visibility === 'private') {
		const user = await resolveUser(event);
		if (!user || !isSameGithubUser({ user, uploader: meta.uploader })) {
			error(404, { message: 'Thread not found' });
		}
	}
	const storedThread = await getThread({ bucket, id: threadId });
	if (!storedThread) {
		error(404, { message: 'Thread not found' });
	}

	const thread = mergeThreadMeta({ thread: storedThread, meta });
	const tool = findThreadTool({ thread, toolId });
	if (!tool) {
		error(404, { message: 'Tool call not found' });
	}

	return { tool: createFullThreadToolCall(tool) };
});

const getThreadTurns = query(GetThreadTurnsSchema, async ({ threadId, offset, limit }) => {
	const thread = await getAuthorizedThreadView(threadId);
	return sliceThreadViewData({ thread, offset, limit });
});

export { getThreadToolPayload, getThreadTurns, setThreadVisibility };
