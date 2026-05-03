import {
	calculateThreadCost,
	formatCost,
	type ThreadData,
	type ToolCall
} from '@threadcast/shared';
import type {
	ThreadStats,
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

const createThreadViewData = (thread: ThreadData): ThreadViewData => {
	return {
		...thread,
		turns: thread.turns.map((turn): ThreadViewTurn => {
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
		}),
		stats: createThreadStats(thread)
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

export { createFullThreadToolCall, createThreadViewData, findThreadTool };
