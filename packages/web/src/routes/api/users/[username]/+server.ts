import { listUserThreads } from '$lib/server/r2';
import * as schema from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/d1';
import { error, json } from '@sveltejs/kit';

export const GET = async ({ params, platform }) => {
	const bucket = platform!.env.THREADS_BUCKET;
	const allThreads = await listUserThreads({ bucket, username: params.username });
	const publicThreads = allThreads.filter((t) => t.metadata.visibility === 'public');

	const db = drizzle(platform!.env.AUTH_DB, { schema });
	const userRow = await db
		.select({
			image: schema.user.image,
			githubBio: schema.user.githubBio
		})
		.from(schema.user)
		.where(eq(schema.user.githubUsername, params.username))
		.get();

	if (!userRow && publicThreads.length === 0) {
		error(404, { message: 'User not found' });
	}

	return json({
		username: params.username,
		image: userRow?.image ?? null,
		githubBio: userRow?.githubBio ?? null,
		threadCount: publicThreads.length
	});
};
