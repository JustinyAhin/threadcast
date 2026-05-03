import type { ProcessedTurn, ThreadData, ToolCall } from '@threadcast/shared';

type ThreadToolResult = {
	content: string;
	isError: boolean;
	omitted?: boolean;
	sizeChars?: number;
};

type ThreadToolCall = Omit<ToolCall, 'result'> & {
	result?: ThreadToolResult;
	hasDeferredPayload?: boolean;
	deferredInputKeys?: string[];
	payloadSizeChars?: number;
};

type ThreadContentBlock =
	| {
			type: 'text';
			text: string;
	  }
	| {
			type: 'tool_call';
			tool: ThreadToolCall;
	  };

type ThreadViewTurn = Omit<ProcessedTurn, 'content'> & {
	content: ThreadContentBlock[];
};

type ThreadStats = {
	files: number;
	linesAdded: number;
	linesRemoved: number;
	promptCount: number;
	estimatedCost: string;
};

type ThreadViewData = Omit<ThreadData, 'turns'> & {
	turns: ThreadViewTurn[];
	stats: ThreadStats;
};

export type { ThreadContentBlock, ThreadStats, ThreadToolCall, ThreadViewData, ThreadViewTurn };
