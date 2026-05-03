import { signOgImagePath } from '$lib/server/og-signing';

export const load = async ({ platform }) => ({
	defaultOgImage: await signOgImagePath({
		path: '/og/threadcast/home.png',
		secret: platform?.env.OG_SIGNING_SECRET
	})
});
