import type { ProcessedTurn, ContentBlock, ToolCall } from "@threadcast/shared";

const MAX_TOOL_OUTPUT_LENGTH = 5000;
const TRUNCATION_NOTICE = "\n... [output truncated]";

const HOME_DIR_PATTERNS = [
  /\/Users\/[^/\s]+/g,
  /\/home\/[^/\s]+/g,
  /C:\\Users\\[^\\]+/g,
];

type SanitizeOptions = {
  homePath?: string;
  projectPath?: string;
};

type SanitizePathsOpts = {
  text: string;
  homePath?: string;
  projectPath?: string;
};

const sanitizePaths = (opts: SanitizePathsOpts): string => {
  let result = opts.text;

  if (opts.projectPath) {
    result = result.replaceAll(opts.projectPath, ".");
  }

  if (opts.homePath) {
    result = result.replaceAll(opts.homePath, "~");
  }

  for (const pattern of HOME_DIR_PATTERNS) {
    result = result.replace(pattern, "~");
  }

  return result;
};

type SanitizeToolInputOpts = {
  input: Record<string, any>;
  homePath?: string;
  projectPath?: string;
};

const sanitizeToolInput = (opts: SanitizeToolInputOpts): Record<string, any> => {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(opts.input)) {
    if (typeof value === "string") {
      result[key] = sanitizePaths({ text: value, homePath: opts.homePath, projectPath: opts.projectPath });
    } else {
      result[key] = value;
    }
  }
  return result;
};

type SanitizeToolCallOpts = {
  tool: ToolCall;
  homePath?: string;
  projectPath?: string;
};

const sanitizeToolCall = (opts: SanitizeToolCallOpts): ToolCall => {
  const sanitized: ToolCall = {
    id: opts.tool.id,
    name: opts.tool.name,
    input: sanitizeToolInput({ input: opts.tool.input, homePath: opts.homePath, projectPath: opts.projectPath }),
  };

  if (opts.tool.result) {
    let content = opts.tool.result.content;
    content = sanitizePaths({ text: content, homePath: opts.homePath, projectPath: opts.projectPath });
    if (content.length > MAX_TOOL_OUTPUT_LENGTH) {
      content =
        content.slice(0, MAX_TOOL_OUTPUT_LENGTH) + TRUNCATION_NOTICE;
    }
    sanitized.result = {
      content,
      isError: opts.tool.result.isError,
    };
  }

  return sanitized;
};

type SanitizeBlockOpts = {
  block: ContentBlock;
  homePath?: string;
  projectPath?: string;
};

const sanitizeBlock = (opts: SanitizeBlockOpts): ContentBlock | null => {
  if (opts.block.type === "text") {
    const text = sanitizePaths({ text: opts.block.text, homePath: opts.homePath, projectPath: opts.projectPath });
    if (!text.trim()) return null;
    return { type: "text", text };
  }

  if (opts.block.type === "tool_call") {
    return {
      type: "tool_call",
      tool: sanitizeToolCall({ tool: opts.block.tool, homePath: opts.homePath, projectPath: opts.projectPath }),
    };
  }

  return opts.block;
};

const sanitizeTurns = (
  turns: ProcessedTurn[],
  options: SanitizeOptions = {}
): ProcessedTurn[] => {
  const { homePath, projectPath } = options;

  return turns
    .map((turn) => ({
      ...turn,
      content: turn.content
        .map((block) => sanitizeBlock({ block, homePath, projectPath }))
        .filter(Boolean) as ContentBlock[],
    }))
    .filter((turn) => turn.content.length > 0);
};

export { sanitizeTurns, type SanitizeOptions };
