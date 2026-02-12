import type { auth } from '$lib/server/auth';

type Session = typeof auth.$Infer.Session.session;
type User = typeof auth.$Infer.Session.user;

declare global {
	namespace App {
		interface Locals {
			user: User | null;
			session: Session | null;
		}

		interface Platform {
			env: {
				THREADS_BUCKET: R2Bucket;
				ASSETS: Fetcher;
			};
			ctx: ExecutionContext;
			caches: CacheStorage;
			cf?: IncomingRequestCfProperties;
		}
	}
}

export {};
