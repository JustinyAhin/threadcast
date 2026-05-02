import type { MessagePart, SkillBlock } from './types';

const SKILL_BLOCK_RE = /<skill>([\s\S]*?)<\/skill>/gi;

const extractTag = (opts: { source: string; tag: string }): string => {
	const match = new RegExp(`<${opts.tag}>([\\s\\S]*?)</${opts.tag}>`, 'i').exec(opts.source);
	return match?.[1]?.trim() ?? '';
};

const parseFrontmatter = (source: string): { data: Record<string, string>; body: string } => {
	const match = /---\s*\n([\s\S]*?)\n---\s*/.exec(source);
	if (!match) return { data: {}, body: source.trim() };

	const data: Record<string, string> = {};
	for (const line of match[1].split('\n')) {
		const [key, ...valueParts] = line.split(':');
		if (!key || valueParts.length === 0) continue;
		data[key.trim()] = valueParts
			.join(':')
			.trim()
			.replace(/^['"]|['"]$/g, '');
	}

	return {
		data,
		body: source.slice(match.index + match[0].length).trim()
	};
};

const getShortPath = (path: string): string => {
	if (!path) return '';
	const normalized = path.replace(/^~\//, '~/');
	const parts = normalized.split('/');
	if (parts.length <= 4) return normalized;
	return `.../${parts.slice(-3).join('/')}`;
};

const parseSkillBlock = (raw: string): SkillBlock => {
	const name = extractTag({ source: raw, tag: 'name' });
	const path = extractTag({ source: raw, tag: 'path' });
	const withoutTags = raw
		.replace(/<name>[\s\S]*?<\/name>/i, '')
		.replace(/<path>[\s\S]*?<\/path>/i, '')
		.trim();
	const frontmatter = parseFrontmatter(withoutTags);
	const title = frontmatter.data.name || name.split(':').at(-1) || name || 'skill';

	return {
		raw,
		name,
		path,
		title,
		description: frontmatter.data.description || '',
		body: frontmatter.body,
		frontmatter: frontmatter.data
	};
};

const parseMessageParts = (text: string): MessagePart[] => {
	const parts: MessagePart[] = [];
	let lastIndex = 0;

	for (const match of text.matchAll(SKILL_BLOCK_RE)) {
		const index = match.index ?? 0;
		const markdown = text.slice(lastIndex, index);
		if (markdown.trim()) parts.push({ type: 'markdown', text: markdown });
		parts.push({ type: 'skill', skill: parseSkillBlock(match[1]) });
		lastIndex = index + match[0].length;
	}

	const trailing = text.slice(lastIndex);
	if (trailing.trim()) parts.push({ type: 'markdown', text: trailing });

	if (parts.length === 0 && text.trim()) return [{ type: 'markdown', text }];
	return parts;
};

export { getShortPath, parseMessageParts };
