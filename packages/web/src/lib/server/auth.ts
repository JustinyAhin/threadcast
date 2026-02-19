import { getRequestEvent } from '$app/server';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { env } from 'cloudflare:workers';
import { db } from './db';
import * as schema from './db/schema';

const auth = betterAuth({
	baseURL: env.BETTER_AUTH_URL,
	secret: env.BETTER_AUTH_SECRET,
	database: drizzleAdapter(db, {
		provider: 'sqlite',
		schema: {
			user: schema.user,
			session: schema.session,
			account: schema.account,
			verification: schema.verification
		}
	}),
	socialProviders: {
		github: {
			clientId: env.GITHUB_CLIENT_ID,
			clientSecret: env.GITHUB_CLIENT_SECRET,
			mapProfileToUser: (profile) => ({
				githubUsername: profile.login,
				githubBio: profile.bio ?? null,
				githubLocation: profile.location ?? null,
				githubBlog: profile.blog ?? null
			})
		}
	},
	user: {
		additionalFields: {
			githubUsername: {
				type: 'string',
				required: false,
				input: false,
				fieldName: 'githubUsername'
			},
			githubBio: {
				type: 'string',
				required: false,
				input: false,
				fieldName: 'githubBio'
			},
			githubLocation: {
				type: 'string',
				required: false,
				input: false,
				fieldName: 'githubLocation'
			},
			githubBlog: {
				type: 'string',
				required: false,
				input: false,
				fieldName: 'githubBlog'
			}
		}
	},
	plugins: [sveltekitCookies(getRequestEvent)]
});

export { auth };
