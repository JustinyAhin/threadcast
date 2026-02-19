import { listUserThreads } from '$lib/server/r2';
import * as schema from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/d1';

export const load = async ({ params, platform, locals }) => {
	const bucket = platform!.env.THREADS_BUCKET;
	const allThreads = await listUserThreads({ bucket, username: params.username });

	const isOwner = locals.user?.githubUsername === params.username;
	const threads = isOwner
		? allThreads
		: allThreads.filter((t) => t.metadata.visibility === 'public');

	const db = drizzle(platform!.env.AUTH_DB, { schema });
	const userRow = await db
		.select({
			image: schema.user.image,
			githubBio: schema.user.githubBio,
			githubLocation: schema.user.githubLocation,
			githubBlog: schema.user.githubBlog
		})
		.from(schema.user)
		.where(eq(schema.user.githubUsername, params.username))
		.get();

	return {
		threads,
		username: params.username,
		profile: userRow ?? null
	};
};
