import { error, type RequestEvent } from '@sveltejs/kit';

type RateLimitOpts = {
	event: RequestEvent;
	limiter: RateLimit;
	name: string;
};

const getClientIp = (event: RequestEvent): string =>
	event.request.headers.get('cf-connecting-ip') ??
	event.request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
	'unknown';

const enforceRateLimit = async (opts: RateLimitOpts): Promise<void> => {
	const key = `${opts.name}:${getClientIp(opts.event)}`;
	const { success } = await opts.limiter.limit({ key });

	if (!success) {
		error(429, { message: 'Too many requests' });
	}
};

export { enforceRateLimit };
