import type { ThreadData, ThreadMetadata, Uploader } from '@threadcast/shared';
import type { ThreadViewData } from '$lib/types/thread-view';

type ThreadMeta = {
	id: string;
	metadata: ThreadMetadata;
	uploader: Uploader;
};

const storeThread = async ({
	bucket,
	id,
	data,
	view
}: {
	bucket: R2Bucket;
	id: string;
	data: ThreadData;
	view: ThreadViewData;
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
		bucket.put(`threads/${id}/view.json`, JSON.stringify(view), {
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
	if (data.uploader.githubId) {
		await updateIndex({
			bucket,
			key: `indexes/by-github-id/${data.uploader.githubId}.json`,
			meta
		});
	}
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

const getThreadView = async ({
	bucket,
	id
}: {
	bucket: R2Bucket;
	id: string;
}): Promise<ThreadViewData | null> => {
	const obj = await bucket.get(`threads/${id}/view.json`);
	if (!obj) return null;
	return obj.json<ThreadViewData>();
};

const storeThreadView = async ({
	bucket,
	id,
	thread
}: {
	bucket: R2Bucket;
	id: string;
	thread: ThreadViewData;
}): Promise<void> => {
	await bucket.put(`threads/${id}/view.json`, JSON.stringify(thread), {
		httpMetadata: { contentType: 'application/json' }
	});
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

const mergeThreadMeta = ({
	thread,
	meta
}: {
	thread: ThreadData;
	meta: ThreadMeta;
}): ThreadData => {
	return {
		...thread,
		metadata: meta.metadata,
		uploader: meta.uploader
	};
};

const mergeThreadViewMeta = ({
	thread,
	meta
}: {
	thread: ThreadViewData;
	meta: ThreadMeta;
}): ThreadViewData => {
	return {
		...thread,
		metadata: meta.metadata,
		uploader: meta.uploader
	};
};

const listRecentThreads = async (bucket: R2Bucket): Promise<ThreadMeta[]> => {
	return readIndex({ bucket, key: 'indexes/recent.json' });
};

const listUserThreads = async ({
	bucket,
	username
}: {
	bucket: R2Bucket;
	username: string;
}): Promise<ThreadMeta[]> => {
	return readIndex({ bucket, key: `indexes/by-user/${username}.json` });
};

const listOwnedThreads = async ({
	bucket,
	githubId,
	username
}: {
	bucket: R2Bucket;
	githubId?: string;
	username: string;
}): Promise<ThreadMeta[]> => {
	const indexes = await Promise.all([
		githubId ? readIndex({ bucket, key: `indexes/by-github-id/${githubId}.json` }) : [],
		readIndex({ bucket, key: `indexes/by-user/${username}.json` })
	]);
	const byId = new Map<string, ThreadMeta>();

	for (const meta of indexes.flat()) {
		if (!isGithubIdCompatible({ githubId, meta })) continue;
		byId.set(meta.id, meta);
	}

	return [...byId.values()].sort(
		(a, b) => new Date(b.metadata.created).getTime() - new Date(a.metadata.created).getTime()
	);
};

const updateThreadVisibility = async ({
	bucket,
	id,
	visibility,
	meta
}: {
	bucket: R2Bucket;
	id: string;
	visibility: 'public' | 'private';
	meta: ThreadMeta;
}): Promise<void> => {
	const updatedMeta: ThreadMeta = {
		...meta,
		metadata: {
			...meta.metadata,
			visibility
		}
	};

	await bucket.put(`threads/${id}/meta.json`, JSON.stringify(updatedMeta), {
		httpMetadata: { contentType: 'application/json' }
	});

	const indexUpdates: Promise<void>[] = [
		visibility === 'public'
			? updateIndex({ bucket, key: 'indexes/recent.json', meta: updatedMeta })
			: removeFromIndex({ bucket, key: 'indexes/recent.json', id }),
		updateIndex({
			bucket,
			key: `indexes/by-user/${updatedMeta.uploader.githubUsername}.json`,
			meta: updatedMeta
		})
	];
	if (meta.uploader.githubId) {
		indexUpdates.push(
			updateIndex({
				bucket,
				key: `indexes/by-github-id/${meta.uploader.githubId}.json`,
				meta: updatedMeta
			})
		);
	}

	await Promise.all(indexUpdates);
};

// ── Index helpers ───────────────────────────────────────────────────────────

const MAX_INDEX_SIZE = 1000;

const isGithubIdCompatible = ({
	githubId,
	meta
}: {
	githubId?: string;
	meta: ThreadMeta;
}): boolean => {
	return !githubId || !meta.uploader.githubId || meta.uploader.githubId === githubId;
};

const readIndex = async ({
	bucket,
	key
}: {
	bucket: R2Bucket;
	key: string;
}): Promise<ThreadMeta[]> => {
	const obj = await bucket.get(key);
	if (!obj) return [];
	return obj.json<ThreadMeta[]>();
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
	const index = await readIndex({ bucket, key });
	// Remove existing entry for this thread (in case of re-upload)
	const filtered = index.filter((m) => m.id !== meta.id);
	// Prepend new entry, cap at max size
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
	const index = await readIndex({ bucket, key });
	const updated = index.filter((m) => m.id !== id);
	if (updated.length !== index.length) {
		await bucket.put(key, JSON.stringify(updated), {
			httpMetadata: { contentType: 'application/json' }
		});
	}
};

const findThreadBySessionId = async ({
	bucket,
	githubId,
	username,
	sessionId,
	source
}: {
	bucket: R2Bucket;
	githubId?: string;
	username: string;
	sessionId: string;
	source: ThreadMetadata['source'];
}): Promise<string | null> => {
	const index = githubId
		? await readIndex({ bucket, key: `indexes/by-github-id/${githubId}.json` })
		: [];
	const entry = index.find(
		(m) => m.metadata.sessionId === sessionId && (m.metadata.source ?? 'claude-code') === source
	);
	if (entry) return entry.id;

	const legacyIndex = await readIndex({ bucket, key: `indexes/by-user/${username}.json` });
	const legacyEntry = legacyIndex.find(
		(m) =>
			isGithubIdCompatible({ githubId, meta: m }) &&
			m.metadata.sessionId === sessionId &&
			(m.metadata.source ?? 'claude-code') === source
	);
	return legacyEntry?.id ?? null;
};

export {
	storeThread,
	getThread,
	getThreadView,
	storeThreadView,
	getThreadMeta,
	mergeThreadMeta,
	mergeThreadViewMeta,
	listRecentThreads,
	listOwnedThreads,
	listUserThreads,
	updateThreadVisibility,
	findThreadBySessionId,
	type ThreadMeta
};
