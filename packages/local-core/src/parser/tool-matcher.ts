import type {
  RawJsonlLine,
  RawContentBlock,
  ContentBlock,
  ToolCall,
  ProcessedTurn,
} from "@threadcast/shared";
import { normalizeClaudeCommandText } from "./claude-command.js";

type MakeAssistantTurnOpts = {
  content: ContentBlock[];
  timestamp: string;
  model: string | undefined;
  inputTokens: number;
  outputTokens: number;
};

const makeAssistantTurn = (opts: MakeAssistantTurnOpts): ProcessedTurn => {
  const turn: ProcessedTurn = {
    role: "assistant",
    timestamp: opts.timestamp,
    content: opts.content,
  };
  if (opts.model || opts.inputTokens > 0 || opts.outputTokens > 0) {
    turn.metadata = {};
    if (opts.model) turn.metadata.model = opts.model;
    if (opts.inputTokens > 0 || opts.outputTokens > 0) {
      turn.metadata.usage = {
        input_tokens: opts.inputTokens,
        output_tokens: opts.outputTokens,
      };
    }
  }
  return turn;
};

const extractUserText = (msg: RawJsonlLine): string => {
  if (!msg.message) return "";
  const content = msg.message.content;
  if (typeof content === "string") return normalizeClaudeCommandText(content);
  if (Array.isArray(content)) {
    const text = content
      .filter(
        (b): b is { type: "text"; text: string } =>
          typeof b === "object" && b.type === "text"
      )
      .map((b) => b.text)
      .join("\n");
    return normalizeClaudeCommandText(text);
  }
  return "";
};

const extractToolResultContent = (
  content: string | RawContentBlock[] | undefined
): string => {
  if (!content) return "";
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((b) => {
        if (typeof b === "object" && "text" in b) return b.text;
        return JSON.stringify(b);
      })
      .join("\n");
  }
  return String(content);
};

const processMessages = (messages: RawJsonlLine[]): ProcessedTurn[] => {
  const toolResults = new Map<
    string,
    { content: string; isError: boolean }
  >();

  for (const msg of messages) {
    if (msg.type !== "user" || !msg.message) continue;
    const content = msg.message.content;
    if (!Array.isArray(content)) continue;

    for (const block of content) {
      if (
        typeof block === "object" &&
        block.type === "tool_result" &&
        "tool_use_id" in block
      ) {
        const resultContent = extractToolResultContent(block.content);
        toolResults.set(block.tool_use_id, {
          content: resultContent,
          isError: false,
        });
      }
    }
  }

  const turns: ProcessedTurn[] = [];
  let currentAssistantBlocks: ContentBlock[] = [];
  let currentAssistantTimestamp: string | undefined;
  let currentModel: string | undefined;
  let totalInputTokens = 0;
  let totalOutputTokens = 0;

  for (const msg of messages) {
    if (!msg.message) continue;

    if (msg.type === "user" && !msg.toolUseResult && !msg.sourceToolAssistantUUID) {
      const text = extractUserText(msg);

      if (!text) continue;

      if (currentAssistantBlocks.length > 0) {
        turns.push(makeAssistantTurn({
          content: currentAssistantBlocks,
          timestamp: currentAssistantTimestamp!,
          model: currentModel,
          inputTokens: totalInputTokens,
          outputTokens: totalOutputTokens,
        }));
        currentAssistantBlocks = [];
        currentAssistantTimestamp = undefined;
        currentModel = undefined;
        totalInputTokens = 0;
        totalOutputTokens = 0;
      }

      turns.push({
        role: "user",
        timestamp: msg.timestamp,
        content: [{ type: "text", text }],
      });
    } else if (msg.type === "assistant") {
      if (!currentAssistantTimestamp) {
        currentAssistantTimestamp = msg.timestamp;
      }

      const msgContent = msg.message.content;
      if (!msgContent) continue;

      if (msg.message.model) {
        currentModel = msg.message.model;
      }
      if (msg.message.usage) {
        totalInputTokens += msg.message.usage.input_tokens || 0;
        totalOutputTokens += msg.message.usage.output_tokens || 0;
      }

      if (Array.isArray(msgContent)) {
        for (const block of msgContent) {
          if (typeof block !== "object") continue;

          if (block.type === "text" && block.text.trim()) {
            currentAssistantBlocks.push({
              type: "text",
              text: block.text,
            });
          } else if (block.type === "tool_use") {
            const toolCall: ToolCall = {
              id: block.id,
              name: block.name,
              input: block.input,
              result: toolResults.get(block.id),
            };
            currentAssistantBlocks.push({
              type: "tool_call",
              tool: toolCall,
            });
          }
        }
      } else if (typeof msgContent === "string" && msgContent.trim()) {
        currentAssistantBlocks.push({
          type: "text",
          text: msgContent,
        });
      }
    }
  }

  if (currentAssistantBlocks.length > 0) {
    turns.push(makeAssistantTurn({
      content: currentAssistantBlocks,
      timestamp: currentAssistantTimestamp!,
      model: currentModel,
      inputTokens: totalInputTokens,
      outputTokens: totalOutputTokens,
    }));
  }

  return turns;
};

export { processMessages };
