import { createId } from '@paralleldrive/cuid2';
import { relations } from 'drizzle-orm';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

const user = sqliteTable('user', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => createId()),
	name: text('name').notNull(),
	email: text('email').notNull().unique(),
	emailVerified: integer('email_verified', { mode: 'boolean' }).notNull(),
	image: text('image'),
	githubUsername: text('github_username'),
	githubBio: text('github_bio'),
	githubLocation: text('github_location'),
	githubBlog: text('github_blog'),
	createdAt: integer('created_at', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date()),
	updatedAt: integer('updated_at', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date())
});

const session = sqliteTable('session', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => createId()),
	expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
	token: text('token').notNull().unique(),
	ipAddress: text('ip_address'),
	userAgent: text('user_agent'),
	userId: text('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	createdAt: integer('created_at', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date()),
	updatedAt: integer('updated_at', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date())
});

const account = sqliteTable('account', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => createId()),
	accountId: text('account_id').notNull(),
	providerId: text('provider_id').notNull(),
	userId: text('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	accessToken: text('access_token'),
	refreshToken: text('refresh_token'),
	idToken: text('id_token'),
	accessTokenExpiresAt: integer('access_token_expires_at', { mode: 'timestamp' }),
	refreshTokenExpiresAt: integer('refresh_token_expires_at', { mode: 'timestamp' }),
	scope: text('scope'),
	password: text('password'),
	createdAt: integer('created_at', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date()),
	updatedAt: integer('updated_at', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date())
});

const verification = sqliteTable('verification', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => createId()),
	identifier: text('identifier').notNull(),
	value: text('value').notNull(),
	expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
	createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
	updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
});

const localAuthCode = sqliteTable('local_auth_code', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => createId()),
	codeHash: text('code_hash').notNull().unique(),
	userId: text('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	githubUsername: text('github_username').notNull(),
	githubAvatarUrl: text('github_avatar_url').notNull(),
	expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
	consumedAt: integer('consumed_at', { mode: 'timestamp' }),
	createdAt: integer('created_at', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date()),
	updatedAt: integer('updated_at', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date())
});

const localAuthToken = sqliteTable('local_auth_token', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => createId()),
	tokenHash: text('token_hash').notNull().unique(),
	userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }),
	githubUsername: text('github_username').notNull(),
	githubAvatarUrl: text('github_avatar_url').notNull(),
	expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
	lastUsedAt: integer('last_used_at', { mode: 'timestamp' }),
	createdAt: integer('created_at', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date()),
	updatedAt: integer('updated_at', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date())
});

const userRelations = relations(user, ({ many }) => ({
	sessions: many(session),
	accounts: many(account),
	localAuthCodes: many(localAuthCode),
	localAuthTokens: many(localAuthToken)
}));

const sessionRelations = relations(session, ({ one }) => ({
	user: one(user, {
		fields: [session.userId],
		references: [user.id]
	})
}));

const accountRelations = relations(account, ({ one }) => ({
	user: one(user, {
		fields: [account.userId],
		references: [user.id]
	})
}));

const localAuthCodeRelations = relations(localAuthCode, ({ one }) => ({
	user: one(user, {
		fields: [localAuthCode.userId],
		references: [user.id]
	})
}));

const localAuthTokenRelations = relations(localAuthToken, ({ one }) => ({
	user: one(user, {
		fields: [localAuthToken.userId],
		references: [user.id]
	})
}));

export {
	account,
	accountRelations,
	localAuthCode,
	localAuthCodeRelations,
	localAuthToken,
	localAuthTokenRelations,
	session,
	sessionRelations,
	user,
	userRelations,
	verification
};
