type Changelog = {
	slug: string;
	title: string;
	date: Date;
	summary: string;
	content: string;
};

const modules = import.meta.glob('/src/lib/content/changelogs/*.md', {
	eager: true,
	query: '?raw',
	import: 'default'
}) as Record<string, string>;

const parseFrontmatter = (raw: string): { data: Record<string, string>; content: string } => {
	const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
	if (!match) return { data: {}, content: raw };

	const data: Record<string, string> = {};
	for (const line of match[1].split('\n')) {
		const sep = line.indexOf(':');
		if (sep === -1) continue;
		const key = line.slice(0, sep).trim();
		const val = line.slice(sep + 1).trim().replace(/^['"]|['"]$/g, '');
		data[key] = val;
	}

	return { data, content: match[2] };
};

const parseChangelog = (filename: string, raw: string): Changelog => {
	const { data, content } = parseFrontmatter(raw);
	const slug = filename.replace('/src/lib/content/changelogs/', '').replace('.md', '');

	return {
		slug,
		title: data.title,
		date: new Date(data.date),
		summary: data.summary,
		content: content.trim()
	};
};

const getChangelogs = (): Changelog[] => {
	return Object.entries(modules)
		.map(([filename, raw]) => parseChangelog(filename, raw))
		.sort((a, b) => b.date.getTime() - a.date.getTime());
};

const getChangelog = (slug: string): Changelog | undefined => {
	const entry = Object.entries(modules).find(([filename]) => filename.endsWith(`/${slug}.md`));

	if (!entry) return undefined;

	return parseChangelog(entry[0], entry[1]);
};

export { getChangelogs, getChangelog, type Changelog };
