const SIGNATURE_PARAM = 'sig';
const SIGNING_ALGORITHM = 'HMAC';
const HASH_ALGORITHM = 'SHA-256';
const SIGNING_BASE_URL = 'https://og.threadcast.local';

const encoder = new TextEncoder();

const canonicalRequest = (path: string) => {
	const parsed = new URL(path, SIGNING_BASE_URL);
	const params = new URLSearchParams(parsed.search);
	params.delete(SIGNATURE_PARAM);

	const entries = [...params.entries()].sort(([keyA, valueA], [keyB, valueB]) =>
		keyA === keyB ? valueA.localeCompare(valueB) : keyA.localeCompare(keyB)
	);
	const canonicalParams = new URLSearchParams();

	for (const [key, value] of entries) {
		canonicalParams.append(key, value);
	}

	const query = canonicalParams.toString();
	return query ? `${parsed.pathname}?${query}` : parsed.pathname;
};

const base64UrlEncode = (buffer: ArrayBuffer) => {
	let value = '';
	for (const byte of new Uint8Array(buffer)) {
		value += String.fromCharCode(byte);
	}

	return btoa(value).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
};

const signOgImagePath = async ({ path, secret }: { path: string; secret?: string }) => {
	if (!secret) return path;

	const key = await crypto.subtle.importKey(
		'raw',
		encoder.encode(secret),
		{ name: SIGNING_ALGORITHM, hash: HASH_ALGORITHM },
		false,
		['sign']
	);
	const signature = base64UrlEncode(
		await crypto.subtle.sign(SIGNING_ALGORITHM, key, encoder.encode(canonicalRequest(path)))
	);
	const separator = path.includes('?') ? '&' : '?';

	return `${path}${separator}${SIGNATURE_PARAM}=${encodeURIComponent(signature)}`;
};

export { signOgImagePath };
