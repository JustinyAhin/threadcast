import {
	getThread,
	getThreadMeta,
	getThreadView,
	mergeThreadMeta,
	mergeThreadViewMeta,
	storeThreadView
} from '$lib/server/r2';
import { isSameGithubUser } from '$lib/server/github-identity';
import { signOgImagePath } from '$lib/server/og-signing';
import { resolveUser } from '$lib/server/resolve-user';
import { createThreadViewData, sliceThreadViewData } from '$lib/server/thread-view-data';
import { INITIAL_THREAD_TURN_COUNT } from '$lib/types/thread-view';
import { error } from '@sveltejs/kit';

export const load = async (event) => {
	const { params, platform } = event;
	const bucket = platform!.env.THREADS_BUCKET;
	const meta = await getThreadMeta({ bucket, id: params.id });

	if (!meta) {
		error(404, { message: 'Thread not found' });
	}

	const user = await resolveUser(event);
	if (meta.metadata.visibility === 'private') {
		if (!user || !isSameGithubUser({ user, uploader: meta.uploader })) {
			error(404, { message: 'Thread not found' });
		}
	}

	let thread = await getThreadView({ bucket, id: params.id });
	if (thread) {
		thread = mergeThreadViewMeta({ thread, meta });
	} else {
		const storedThread = await getThread({ bucket, id: params.id });
		if (!storedThread) {
			error(404, { message: 'Thread not found' });
		}
		thread = createThreadViewData(mergeThreadMeta({ thread: storedThread, meta }));
		platform?.ctx.waitUntil(storeThreadView({ bucket, id: params.id, thread }));
	}

	const isOwner = user ? isSameGithubUser({ user, uploader: meta.uploader }) : false;
	const ogImage =
		thread.metadata.visibility === 'public'
			? await signOgImagePath({
					path: `/og/threadcast/threads/${params.id}.png`,
					secret: platform?.env.OG_SIGNING_SECRET
				})
			: undefined;

	const initialTurns = sliceThreadViewData({
		thread,
		offset: 0,
		limit: INITIAL_THREAD_TURN_COUNT
	});

	return {
		thread: {
			...thread,
			turns: initialTurns.turns,
			totalTurnCount: initialTurns.totalTurnCount
		},
		id: params.id,
		isOwner,
		ogImage
	};
};
