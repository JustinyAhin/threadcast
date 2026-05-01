import type { createAuth } from '$lib/server/auth';

type Auth = ReturnType<typeof createAuth>;
type Session = Auth['$Infer']['Session']['session'];
type User = Auth['$Infer']['Session']['user'];

declare global {
	namespace App {
		interface Locals {
			user: User | null;
			session: Session | null;
		}

		interface Platform {
			env: Env;
			ctx: ExecutionContext;
			caches: CacheStorage;
			cf?: IncomingRequestCfProperties;
		}
	}
}

export {};
