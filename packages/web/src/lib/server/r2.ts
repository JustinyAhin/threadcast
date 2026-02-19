import type { ThreadData, ThreadMetadata, Uploader } from '@threadcast/shared';

type ThreadMeta = {
	id: string;
	metadata: ThreadMetadata;
	uploader: Uploader;
};

const storeThread = async ({
	bucket,
	id,
	data
}: {
	bucket: R2Bucket;
	id: string;
	data: ThreadData;
}): Promise<void> => {
	const meta: ThreadMeta = {
		id,
		metadata: data.metadata,
		uploader: data.uploader
	};

	await Promise.all([
		bucket.put(`threads/${id}/data.json`, JSON.stringify(data), {
			httpMetadata: { contentType: 'application/json' }
		}),
		bucket.put(`threads/${id}/meta.json`, JSON.stringify(meta), {
			httpMetadata: { contentType: 'application/json' }
		})
	]);

	if (data.metadata.visibility === 'public') {
		await updateIndex({ bucket, key: 'indexes/recent.json', meta });
	}
	await updateIndex({
		bucket,
		key: `indexes/by-user/${data.uploader.githubUsername}.json`,
		meta
	});
};

const getThread = async ({
	bucket,
	id
}: {
	bucket: R2Bucket;
	id: string;
}): Promise<ThreadData | null> => {
	const obj = await bucket.get(`threads/${id}/data.json`);
	if (!obj) return null;
	return obj.json<ThreadData>();
};

const getThreadMeta = async ({
	bucket,
	id
}: {
	bucket: R2Bucket;
	id: string;
}): Promise<ThreadMeta | null> => {
	const obj = await bucket.get(`threads/${id}/meta.json`);
	if (!obj) return null;
	return obj.json<ThreadMeta>();
};

const listRecentThreads = async (bucket: R2Bucket): Promise<ThreadMeta[]> => {
	const { entries } = await readIndex({ bucket, key: 'indexes/recent.json' });
	return entries;
};

const listUserThreads = async ({
	bucket,
	username
}: {
	bucket: R2Bucket;
	username: string;
}): Promise<ThreadMeta[]> => {
	const { entries } = await readIndex({ bucket, key: `indexes/by-user/${username}.json` });
	return entries;
};

const updateThreadVisibility = async ({
	bucket,
	id,
	visibility
}: {
	bucket: R2Bucket;
	id: string;
	visibility: 'public' | 'private';
}): Promise<void> => {
	const [data, meta] = await Promise.all([
		getThread({ bucket, id }),
		getThreadMeta({ bucket, id })
	]);
	if (!data || !meta) throw new Error('Thread not found');

	data.metadata.visibility = visibility;
	meta.metadata.visibility = visibility;

	await Promise.all([
		bucket.put(`threads/${id}/data.json`, JSON.stringify(data), {
			httpMetadata: { contentType: 'application/json' }
		}),
		bucket.put(`threads/${id}/meta.json`, JSON.stringify(meta), {
			httpMetadata: { contentType: 'application/json' }
		})
	]);

	if (visibility === 'public') {
		await updateIndex({ bucket, key: 'indexes/recent.json', meta });
	} else {
		await removeFromIndex({ bucket, key: 'indexes/recent.json', id });
	}

	// Always update user index to reflect new metadata
	await updateIndex({
		bucket,
		key: `indexes/by-user/${meta.uploader.githubUsername}.json`,
		meta
	});
};

const deleteThread = async ({ bucket, id }: { bucket: R2Bucket; id: string }): Promise<boolean> => {
	const meta = await getThreadMeta({ bucket, id });
	if (!meta) return false;

	await Promise.all([
		bucket.delete(`threads/${id}/data.json`),
		bucket.delete(`threads/${id}/meta.json`)
	]);

	await removeFromIndex({ bucket, key: 'indexes/recent.json', id });
	await removeFromIndex({
		bucket,
		key: `indexes/by-user/${meta.uploader.githubUsername}.json`,
		id
	});

	return true;
};

// ── Index helpers ───────────────────────────────────────────────────────────

const MAX_INDEX_SIZE = 1000;
const MAX_RETRIES = 3;

type IndexResult = {
	entries: ThreadMeta[];
	etag: string | undefined;
};

const readIndex = async ({
	bucket,
	key
}: {
	bucket: R2Bucket;
	key: string;
}): Promise<IndexResult> => {
	const obj = await bucket.get(key);
	if (!obj) return { entries: [], etag: undefined };
	const entries = await obj.json<ThreadMeta[]>();
	return { entries, etag: obj.httpEtag };
};

const conditionalPut = async ({
	bucket,
	key,
	data,
	etag
}: {
	bucket: R2Bucket;
	key: string;
	data: string;
	etag: string | undefined;
}): Promise<boolean> => {
	const opts: R2PutOptions = {
		httpMetadata: { contentType: 'application/json' }
	};
	if (etag) {
		opts.onlyIf = { etagMatches: etag };
	}
	const result = await bucket.put(key, data, opts);
	return result !== null;
};

const updateIndex = async ({
	bucket,
	key,
	meta
}: {
	bucket: R2Bucket;
	key: string;
	meta: ThreadMeta;
}): Promise<void> => {
	for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
		const { entries, etag } = await readIndex({ bucket, key });
		const filtered = entries.filter((m) => m.id !== meta.id);
		const updated = [meta, ...filtered].slice(0, MAX_INDEX_SIZE);
		const success = await conditionalPut({ bucket, key, data: JSON.stringify(updated), etag });
		if (success) return;
	}
	// Final unconditional write as fallback
	const { entries } = await readIndex({ bucket, key });
	const filtered = entries.filter((m) => m.id !== meta.id);
	const updated = [meta, ...filtered].slice(0, MAX_INDEX_SIZE);
	await bucket.put(key, JSON.stringify(updated), {
		httpMetadata: { contentType: 'application/json' }
	});
};

const removeFromIndex = async ({
	bucket,
	key,
	id
}: {
	bucket: R2Bucket;
	key: string;
	id: string;
}): Promise<void> => {
	for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
		const { entries, etag } = await readIndex({ bucket, key });
		const updated = entries.filter((m) => m.id !== id);
		if (updated.length === entries.length) return; // nothing to remove
		const success = await conditionalPut({ bucket, key, data: JSON.stringify(updated), etag });
		if (success) return;
	}
	// Final unconditional write as fallback
	const { entries } = await readIndex({ bucket, key });
	const updated = entries.filter((m) => m.id !== id);
	if (updated.length !== entries.length) {
		await bucket.put(key, JSON.stringify(updated), {
			httpMetadata: { contentType: 'application/json' }
		});
	}
};

const findThreadBySessionId = async ({
	bucket,
	username,
	sessionId
}: {
	bucket: R2Bucket;
	username: string;
	sessionId: string;
}): Promise<string | null> => {
	const { entries } = await readIndex({ bucket, key: `indexes/by-user/${username}.json` });
	const entry = entries.find((m) => m.metadata.sessionId === sessionId);
	return entry?.id ?? null;
};

const deleteUserThreads = async ({
	bucket,
	username
}: {
	bucket: R2Bucket;
	username: string;
}): Promise<void> => {
	const { entries } = await readIndex({ bucket, key: `indexes/by-user/${username}.json` });

	// Delete all thread data and meta files
	await Promise.all(
		entries.flatMap((entry) => [
			bucket.delete(`threads/${entry.id}/data.json`),
			bucket.delete(`threads/${entry.id}/meta.json`)
		])
	);

	// Remove each thread from the recent index
	for (const entry of entries) {
		await removeFromIndex({ bucket, key: 'indexes/recent.json', id: entry.id });
	}

	// Delete the user index itself
	await bucket.delete(`indexes/by-user/${username}.json`);
};

export {
	storeThread,
	getThread,
	getThreadMeta,
	listRecentThreads,
	listUserThreads,
	updateThreadVisibility,
	deleteThread,
	deleteUserThreads,
	findThreadBySessionId,
	type ThreadMeta
};
