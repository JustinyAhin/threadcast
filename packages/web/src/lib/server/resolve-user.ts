import type { RequestEvent } from '@sveltejs/kit';
import { getDb } from './db';
import { account, user } from './db/schema';
import type { ResolvedGithubUser } from './github-identity';
import { validateLocalAuthToken } from './local-auth';
import { and, eq } from 'drizzle-orm';

const resolveGithubIdForWebUser = async (opts: {
	db: ReturnType<typeof getDb>;
	userId: string;
}): Promise<string | undefined> => {
	const row = await opts.db
		.select({ accountId: account.accountId })
		.from(account)
		.where(and(eq(account.userId, opts.userId), eq(account.providerId, 'github')))
		.limit(1)
		.get();

	if (!row?.accountId) return undefined;

	await opts.db
		.update(user)
		.set({ githubId: row.accountId, updatedAt: new Date() })
		.where(eq(user.id, opts.userId));

	return row.accountId;
};

const resolveUser = async (event: RequestEvent): Promise<ResolvedGithubUser | null> => {
	// 1. Check web session (Better Auth)
	const localUser = event.locals.user;
	if (localUser?.githubUsername) {
		const db = getDb(event.platform!.env.AUTH_DB);
		const githubId =
			localUser.githubId ?? (await resolveGithubIdForWebUser({ db, userId: localUser.id }));

		return {
			githubId,
			login: localUser.githubUsername,
			avatarUrl: localUser.image ?? ''
		};
	}

	// 2. Check ThreadCast local client bearer token
	const authHeader = event.request.headers.get('authorization');
	if (authHeader?.startsWith('Bearer ')) {
		const token = authHeader.slice(7);
		const localUser = await validateLocalAuthToken({
			db: getDb(event.platform!.env.AUTH_DB),
			token
		});
		if (!localUser) return null;
		return {
			githubId: localUser.githubId,
			login: localUser.githubUsername,
			avatarUrl: localUser.githubAvatarUrl
		};
	}

	return null;
};

export { resolveUser };
