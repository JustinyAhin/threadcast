import type { ProcessedTurn, ThreadData, ToolCall } from '@threadcast/shared';

const INITIAL_THREAD_TURN_COUNT = 24;
const THREAD_TURN_PAGE_SIZE = 24;

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

type ThreadPromptNavItem = {
	turnIndex: number;
	userNumber: number;
	preview: {
		text: string;
		isSkill: boolean;
	};
};

type ThreadViewData = Omit<ThreadData, 'turns'> & {
	turns: ThreadViewTurn[];
	stats: ThreadStats;
	totalTurnCount: number;
	promptNav: ThreadPromptNavItem[];
};

type ThreadTurnSlice = {
	turns: ThreadViewTurn[];
	nextOffset: number;
	hasMore: boolean;
	totalTurnCount: number;
};

export { INITIAL_THREAD_TURN_COUNT, THREAD_TURN_PAGE_SIZE };
export type {
	ThreadContentBlock,
	ThreadPromptNavItem,
	ThreadStats,
	ThreadToolCall,
	ThreadTurnSlice,
	ThreadViewData,
	ThreadViewTurn
};
