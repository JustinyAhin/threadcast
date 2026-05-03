import { getThread, getThreadMeta } from '$lib/server/r2';
import { isSameGithubUser } from '$lib/server/github-identity';
import { signOgImagePath } from '$lib/server/og-signing';
import { resolveUser } from '$lib/server/resolve-user';
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

	const thread = await getThread({ bucket, id: params.id });
	if (!thread) {
		error(404, { message: 'Thread not found' });
	}

	const isOwner = user ? isSameGithubUser({ user, uploader: meta.uploader }) : false;
	const ogImage =
		thread.metadata.visibility === 'public'
			? await signOgImagePath({
					path: `/og/threadcast/threads/${params.id}.png`,
					secret: platform?.env.OG_SIGNING_SECRET
				})
			: undefined;

	return { thread, id: params.id, isOwner, ogImage };
};
