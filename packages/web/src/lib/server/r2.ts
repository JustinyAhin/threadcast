import type { ThreadData, ThreadMetadata, Uploader } from '@threadcast/shared';

export interface ThreadMeta {
	id: string;
	metadata: ThreadMetadata;
	uploader: Uploader;
}

export async function storeThread(
	bucket: R2Bucket,
	id: string,
	data: ThreadData
): Promise<void> {
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

	await updateIndex(bucket, 'indexes/recent.json', meta);
	await updateIndex(bucket, `indexes/by-user/${data.uploader.githubUsername}.json`, meta);
}

export async function getThread(bucket: R2Bucket, id: string): Promise<ThreadData | null> {
	const obj = await bucket.get(`threads/${id}/data.json`);
	if (!obj) return null;
	return obj.json<ThreadData>();
}

export async function getThreadMeta(bucket: R2Bucket, id: string): Promise<ThreadMeta | null> {
	const obj = await bucket.get(`threads/${id}/meta.json`);
	if (!obj) return null;
	return obj.json<ThreadMeta>();
}

export async function listRecentThreads(bucket: R2Bucket): Promise<ThreadMeta[]> {
	return readIndex(bucket, 'indexes/recent.json');
}

export async function listUserThreads(
	bucket: R2Bucket,
	username: string
): Promise<ThreadMeta[]> {
	return readIndex(bucket, `indexes/by-user/${username}.json`);
}

export async function deleteThread(
	bucket: R2Bucket,
	id: string
): Promise<boolean> {
	const meta = await getThreadMeta(bucket, id);
	if (!meta) return false;

	await Promise.all([
		bucket.delete(`threads/${id}/data.json`),
		bucket.delete(`threads/${id}/meta.json`)
	]);

	await removeFromIndex(bucket, 'indexes/recent.json', id);
	await removeFromIndex(
		bucket,
		`indexes/by-user/${meta.uploader.githubUsername}.json`,
		id
	);

	return true;
}

// ── Index helpers ───────────────────────────────────────────────────────────

const MAX_INDEX_SIZE = 1000;

async function readIndex(bucket: R2Bucket, key: string): Promise<ThreadMeta[]> {
	const obj = await bucket.get(key);
	if (!obj) return [];
	return obj.json<ThreadMeta[]>();
}

async function updateIndex(
	bucket: R2Bucket,
	key: string,
	meta: ThreadMeta
): Promise<void> {
	const index = await readIndex(bucket, key);
	// Remove existing entry for this thread (in case of re-upload)
	const filtered = index.filter((m) => m.id !== meta.id);
	// Prepend new entry, cap at max size
	const updated = [meta, ...filtered].slice(0, MAX_INDEX_SIZE);
	await bucket.put(key, JSON.stringify(updated), {
		httpMetadata: { contentType: 'application/json' }
	});
}

async function removeFromIndex(bucket: R2Bucket, key: string, id: string): Promise<void> {
	const index = await readIndex(bucket, key);
	const updated = index.filter((m) => m.id !== id);
	if (updated.length !== index.length) {
		await bucket.put(key, JSON.stringify(updated), {
			httpMetadata: { contentType: 'application/json' }
		});
	}
}
