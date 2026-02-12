declare global {
	namespace App {
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
