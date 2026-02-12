import { getChangelogs } from '$lib/changelog';

export const load = () => {
	const changelogs = getChangelogs();
	return { changelogs };
};
