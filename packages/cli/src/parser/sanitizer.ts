import type { ProcessedTurn, ContentBlock, ToolCall } from "@threadcast/shared";

const MAX_TOOL_OUTPUT_LENGTH = 5000;
const TRUNCATION_NOTICE = "\n... [output truncated]";

// Common home directory patterns to strip
const HOME_DIR_PATTERNS = [
  /\/Users\/[^/\s]+/g,
  /\/home\/[^/\s]+/g,
  /C:\\Users\\[^\\]+/g,
];

/**
 * Sanitize processed turns:
 * 1. Replace absolute home paths with ~
 * 2. Truncate long tool outputs
 * 3. Strip any remaining thinking blocks (already handled in tool-matcher)
 * 4. Remove empty turns
 */
export function sanitizeTurns(
  turns: ProcessedTurn[],
  options: SanitizeOptions = {}
): ProcessedTurn[] {
  const { homePath, projectPath } = options;

  return turns
    .map((turn) => ({
      ...turn,
      content: turn.content
        .map((block) => sanitizeBlock(block, homePath, projectPath))
        .filter(Boolean) as ContentBlock[],
    }))
    .filter((turn) => turn.content.length > 0);
}

export interface SanitizeOptions {
  /** User's home directory path to replace with ~ */
  homePath?: string;
  /** Project root path to replace with ./ */
  projectPath?: string;
}

function sanitizeBlock(
  block: ContentBlock,
  homePath?: string,
  projectPath?: string
): ContentBlock | null {
  if (block.type === "text") {
    const text = sanitizePaths(block.text, homePath, projectPath);
    if (!text.trim()) return null;
    return { type: "text", text };
  }

  if (block.type === "tool_call") {
    return {
      type: "tool_call",
      tool: sanitizeToolCall(block.tool, homePath, projectPath),
    };
  }

  return block;
}

function sanitizeToolCall(
  tool: ToolCall,
  homePath?: string,
  projectPath?: string
): ToolCall {
  const sanitized: ToolCall = {
    id: tool.id,
    name: tool.name,
    input: sanitizeToolInput(tool.input, homePath, projectPath),
  };

  if (tool.result) {
    let content = tool.result.content;
    content = sanitizePaths(content, homePath, projectPath);
    if (content.length > MAX_TOOL_OUTPUT_LENGTH) {
      content =
        content.slice(0, MAX_TOOL_OUTPUT_LENGTH) + TRUNCATION_NOTICE;
    }
    sanitized.result = {
      content,
      isError: tool.result.isError,
    };
  }

  return sanitized;
}

function sanitizeToolInput(
  input: Record<string, any>,
  homePath?: string,
  projectPath?: string
): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(input)) {
    if (typeof value === "string") {
      result[key] = sanitizePaths(value, homePath, projectPath);
    } else {
      result[key] = value;
    }
  }
  return result;
}

function sanitizePaths(
  text: string,
  homePath?: string,
  projectPath?: string
): string {
  let result = text;

  // Replace project path first (more specific, longer path)
  if (projectPath) {
    result = result.replaceAll(projectPath, ".");
  }

  // Replace home directory
  if (homePath) {
    result = result.replaceAll(homePath, "~");
  }

  // Fallback: generic home directory patterns
  for (const pattern of HOME_DIR_PATTERNS) {
    result = result.replace(pattern, "~");
  }

  return result;
}
