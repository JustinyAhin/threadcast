import { isSameGithubUser } from '$lib/server/github-identity';
import { getThreadMeta, updateThreadVisibility } from '$lib/server/r2';
import { resolveUser } from '$lib/server/resolve-user';
import { command, getRequestEvent } from '$app/server';
import { error } from '@sveltejs/kit';
import { z } from 'zod';

const SetThreadVisibilitySchema = z.object({
	id: z.string().min(1),
	visibility: z.enum(['public', 'private'])
});

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

	await updateThreadVisibility({ bucket, id, visibility });
	return { visibility };
});

export { setThreadVisibility };
