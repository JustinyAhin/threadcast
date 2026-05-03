import {
	calculateThreadCost,
	formatCost,
	type ThreadData,
	type ToolCall
} from '@threadcast/shared';
import type {
	ThreadPromptNavItem,
	ThreadStats,
	ThreadTurnSlice,
	ThreadToolCall,
	ThreadViewData,
	ThreadViewTurn
} from '$lib/types/thread-view';

const MAX_INLINE_INPUT_CHARS = 500;
const DEFERRED_INPUT_KEYS = new Set(['old_string', 'new_string', 'content']);

const getStringSize = (value: string): number => value.length;

const createDeferredValue = (value: string): string => `[deferred ${getStringSize(value)} chars]`;

const pruneInput = (input: ToolCall['input']) => {
	const pruned: ToolCall['input'] = {};
	const deferredKeys: string[] = [];
	let payloadSizeChars = 0;

	for (const [key, value] of Object.entries(input)) {
		if (
			typeof value === 'string' &&
			(DEFERRED_INPUT_KEYS.has(key) || getStringSize(value) > MAX_INLINE_INPUT_CHARS)
		) {
			deferredKeys.push(key);
			payloadSizeChars += getStringSize(value);
			pruned[key] = createDeferredValue(value);
			continue;
		}

		pruned[key] = value;
	}

	return { input: pruned, deferredKeys, payloadSizeChars };
};

const createThreadToolCall = ({
	tool,
	deferPayload
}: {
	tool: ToolCall;
	deferPayload: boolean;
}) => {
	const pruned = deferPayload
		? pruneInput(tool.input)
		: { input: tool.input, deferredKeys: [], payloadSizeChars: 0 };
	const resultSizeChars = tool.result ? getStringSize(tool.result.content) : 0;
	const hasDeferredResult = deferPayload && Boolean(tool.result);
	const hasDeferredPayload = pruned.deferredKeys.length > 0 || hasDeferredResult;

	const result =
		tool.result &&
		(hasDeferredResult
			? {
					content: '',
					isError: tool.result.isError,
					omitted: true,
					sizeChars: resultSizeChars
				}
			: tool.result);

	return {
		...tool,
		input: pruned.input,
		result,
		hasDeferredPayload,
		deferredInputKeys: pruned.deferredKeys,
		payloadSizeChars: pruned.payloadSizeChars + (hasDeferredResult ? resultSizeChars : 0)
	} satisfies ThreadToolCall;
};

const createThreadStats = (thread: ThreadData): ThreadStats => {
	const files = new Set<string>();
	let linesAdded = 0;
	let linesRemoved = 0;
	let promptCount = 0;

	for (const turn of thread.turns) {
		if (turn.role === 'user') promptCount++;

		for (const block of turn.content) {
			if (block.type !== 'tool_call') continue;
			const { name, input } = block.tool;

			if ((name === 'Edit' || name === 'Write' || name === 'Read') && input.file_path) {
				files.add(input.file_path as string);
			}

			if (name === 'Edit') {
				const oldLines = ((input.old_string as string) ?? '').split('\n').length;
				const newLines = ((input.new_string as string) ?? '').split('\n').length;
				linesAdded += newLines;
				linesRemoved += oldLines;
			}

			if (name === 'Write') {
				const content = (input.content as string) ?? '';
				linesAdded += content.split('\n').length;
			}
		}
	}

	return {
		files: files.size,
		linesAdded,
		linesRemoved,
		promptCount,
		estimatedCost: formatCost(calculateThreadCost(thread.turns))
	};
};

const extractTag = ({ source, tag }: { source: string; tag: string }): string => {
	const match = new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, 'i').exec(source);
	return match?.[1]?.trim() ?? '';
};

const extractFrontmatterName = (source: string): string => {
	const match = /---\s*\n([\s\S]*?)\n---\s*/.exec(source);
	if (!match) return '';

	for (const line of match[1].split('\n')) {
		const [key, ...valueParts] = line.split(':');
		if (key?.trim() !== 'name' || valueParts.length === 0) continue;
		return valueParts
			.join(':')
			.trim()
			.replace(/^['"]|['"]$/g, '');
	}

	return '';
};

const getSkillCommandPreview = (text: string): string | null => {
	const match = /^\$([a-z0-9-]+):([a-z0-9-]+)\s*$/i.exec(text);
	if (!match) return null;
	return `Skill · ${match[2]}`;
};

const getSkillBlockPreview = (text: string): string | null => {
	const match = /<skill>([\s\S]*?)<\/skill>/i.exec(text);
	if (!match) return null;

	const raw = match[1];
	const name = extractTag({ source: raw, tag: 'name' });
	const title = extractFrontmatterName(raw) || name.split(':').at(-1) || name || 'skill';
	return `Skill · ${title}`;
};

const getPromptPreview = (turn: ThreadViewTurn): ThreadPromptNavItem['preview'] => {
	const text = turn.content
		.filter((block) => block.type === 'text')
		.map((block) => block.text)
		.join(' ')
		.replace(/\n+/g, ' ')
		.trim();
	const skillPreview = getSkillCommandPreview(text) ?? getSkillBlockPreview(text);

	return {
		text: skillPreview ?? (text || 'Empty prompt'),
		isSkill: Boolean(skillPreview)
	};
};

const createPromptNav = (turns: ThreadViewTurn[]): ThreadPromptNavItem[] => {
	let userNumber = 0;

	return turns.flatMap((turn, turnIndex) => {
		if (turn.role !== 'user') return [];
		userNumber += 1;
		return [{ turnIndex, userNumber, preview: getPromptPreview(turn) }];
	});
};

const createThreadViewData = (thread: ThreadData): ThreadViewData => {
	const turns = thread.turns.map((turn): ThreadViewTurn => {
		return {
			...turn,
			content: turn.content.map((block) => {
				if (block.type === 'text') return block;
				return {
					type: 'tool_call',
					tool: createThreadToolCall({ tool: block.tool, deferPayload: true })
				};
			})
		};
	});

	return {
		...thread,
		turns,
		stats: createThreadStats(thread),
		totalTurnCount: thread.turns.length,
		promptNav: createPromptNav(turns)
	};
};

const sliceThreadViewData = ({
	thread,
	offset,
	limit
}: {
	thread: ThreadViewData;
	offset: number;
	limit: number;
}): ThreadTurnSlice => {
	const safeOffset = Math.max(0, Math.min(offset, thread.turns.length));
	const safeLimit = Math.max(1, limit);
	const turns = thread.turns.slice(safeOffset, safeOffset + safeLimit);
	const nextOffset = safeOffset + turns.length;

	return {
		turns,
		nextOffset,
		hasMore: nextOffset < thread.turns.length,
		totalTurnCount: thread.turns.length
	};
};

const createFullThreadToolCall = (tool: ToolCall): ThreadToolCall => {
	return createThreadToolCall({ tool, deferPayload: false });
};

const findThreadTool = ({
	thread,
	toolId
}: {
	thread: ThreadData;
	toolId: string;
}): ToolCall | null => {
	for (const turn of thread.turns) {
		for (const block of turn.content) {
			if (block.type === 'tool_call' && block.tool.id === toolId) {
				return block.tool;
			}
		}
	}

	return null;
};

export { createFullThreadToolCall, createThreadViewData, findThreadTool, sliceThreadViewData };
