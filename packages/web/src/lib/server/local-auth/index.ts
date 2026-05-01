import { localAuthCode, localAuthToken } from '$lib/server/db/schema';
import type { getDb } from '$lib/server/db';
import { createId } from '@paralleldrive/cuid2';
import { and, eq, gt, isNull } from 'drizzle-orm';

const LOCAL_TOKEN_TTL_DAYS = 90;
const LOCAL_AUTH_CODE_TTL_MINUTES = 5;

type Db = ReturnType<typeof getDb>;

type LocalAuthUser = {
	userId?: string;
	githubUsername: string;
	githubAvatarUrl: string;
};

type LocalAuthCodeUser = {
	userId: string;
	githubUsername: string;
	githubAvatarUrl: string;
};

type IssuedLocalAuthToken = LocalAuthUser & {
	token: string;
	expiresAt: string;
};

const toHex = (buffer: ArrayBuffer): string =>
	Array.from(new Uint8Array(buffer))
		.map((byte) => byte.toString(16).padStart(2, '0'))
		.join('');

const randomToken = (prefix: string): string => `${prefix}_${createId()}_${createId()}`;

const hashSecret = async (secret: string): Promise<string> => {
	const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(secret));
	return toHex(digest);
};

const getExpiry = (opts: { days?: number; minutes?: number }): Date => {
	const date = new Date();
	if (opts.days) date.setDate(date.getDate() + opts.days);
	if (opts.minutes) date.setMinutes(date.getMinutes() + opts.minutes);
	return date;
};

const createLocalAuthCode = async (opts: LocalAuthCodeUser & { db: Db }): Promise<string> => {
	const { db, ...user } = opts;
	const code = randomToken('tc_code');
	const now = new Date();
	await db.insert(localAuthCode).values({
		codeHash: await hashSecret(code),
		userId: user.userId,
		githubUsername: user.githubUsername,
		githubAvatarUrl: user.githubAvatarUrl,
		expiresAt: getExpiry({ minutes: LOCAL_AUTH_CODE_TTL_MINUTES }),
		createdAt: now,
		updatedAt: now
	});
	return code;
};

const consumeLocalAuthCode = async (opts: { db: Db; code: string }): Promise<LocalAuthUser | null> => {
	const { db, code } = opts;
	const now = new Date();
	const rows = await db
		.select()
		.from(localAuthCode)
		.where(
			and(
				eq(localAuthCode.codeHash, await hashSecret(code)),
				isNull(localAuthCode.consumedAt),
				gt(localAuthCode.expiresAt, now)
			)
		)
		.limit(1);
	const entry = rows[0];
	if (!entry) return null;

	await db
		.update(localAuthCode)
		.set({ consumedAt: now, updatedAt: now })
		.where(eq(localAuthCode.id, entry.id));

	return {
		userId: entry.userId,
		githubUsername: entry.githubUsername,
		githubAvatarUrl: entry.githubAvatarUrl
	};
};

const issueLocalAuthToken = async (opts: LocalAuthUser & { db: Db }): Promise<IssuedLocalAuthToken> => {
	const { db, ...user } = opts;
	const token = randomToken('tc_local');
	const expiresAt = getExpiry({ days: LOCAL_TOKEN_TTL_DAYS });
	const now = new Date();

	await db.insert(localAuthToken).values({
		tokenHash: await hashSecret(token),
		userId: user.userId,
		githubUsername: user.githubUsername,
		githubAvatarUrl: user.githubAvatarUrl,
		expiresAt,
		createdAt: now,
		updatedAt: now
	});

	return {
		...user,
		token,
		expiresAt: expiresAt.toISOString()
	};
};

const exchangeLocalAuthCode = async (opts: {
	db: Db;
	code: string;
}): Promise<IssuedLocalAuthToken | null> => {
	const { db, code } = opts;
	const user = await consumeLocalAuthCode({ db, code });
	if (!user) return null;
	return issueLocalAuthToken({ db, ...user });
};

const validateLocalAuthToken = async (opts: { db: Db; token: string }): Promise<LocalAuthUser | null> => {
	const { db, token } = opts;
	const now = new Date();
	const rows = await db
		.select()
		.from(localAuthToken)
		.where(
			and(eq(localAuthToken.tokenHash, await hashSecret(token)), gt(localAuthToken.expiresAt, now))
		)
		.limit(1);
	const entry = rows[0];
	if (!entry) return null;

	await db
		.update(localAuthToken)
		.set({ lastUsedAt: now, updatedAt: now })
		.where(eq(localAuthToken.id, entry.id));

	return {
		userId: entry.userId ?? undefined,
		githubUsername: entry.githubUsername,
		githubAvatarUrl: entry.githubAvatarUrl
	};
};

export {
	createLocalAuthCode,
	exchangeLocalAuthCode,
	issueLocalAuthToken,
	validateLocalAuthToken,
	type IssuedLocalAuthToken,
	type LocalAuthUser
};
