import { error } from '@sveltejs/kit';
import { getChangelog } from '$lib/changelog';

export const load = ({ params }) => {
	const changelog = getChangelog(params.slug);

	if (!changelog) {
		error(404, 'Changelog entry not found');
	}

	return { changelog };
};
