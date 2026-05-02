import { createReadStream } from "node:fs";
import { createInterface } from "node:readline";
import { basename } from "node:path";
import { homedir } from "node:os";
import type {
  ContentBlock,
  ProcessedTurn,
  ThreadData,
  ThreadMetadata,
  ToolCall,
  Uploader,
} from "@threadcast/shared";
import { sanitizeTurns } from "./sanitizer.js";
import type { SanitizeOptions } from "../types.js";

type CodexRecord = {
  timestamp?: string;
  type?: string;
  payload?: Record<string, any>;
};

type CodexMetadata = {
  sessionId: string;
  cwd?: string;
  gitBranch?: string;
  model?: string;
  firstTimestamp?: string;
  lastTimestamp?: string;
};

const extractText = (content: unknown): string => {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  return content
    .map((block) => {
      if (!block || typeof block !== "object") return "";
      const item = block as { type?: unknown; text?: unknown };
      if (
        (item.type === "input_text" || item.type === "output_text" || item.type === "text") &&
        typeof item.text === "string"
      ) {
        return item.text;
      }
      return "";
    })
    .filter(Boolean)
    .join("\n");
};

const CODEX_INTERNAL_PREFIXES = ["# AGENTS.md instructions", "<environment_context>"];

const isInternalText = (text: string): boolean => {
  const trimmed = text.trim();
  return CODEX_INTERNAL_PREFIXES.some((prefix) => trimmed.startsWith(prefix));
};

const parseToolInput = (value: unknown): Record<string, any> => {
  if (value && typeof value === "object" && !Array.isArray(value)) return value as Record<string, any>;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as Record<string, any>;
      }
    } catch {
      // Keep the raw value below.
    }
  }
  return { arguments: value ?? "" };
};

const formatDuration = (ms: number): string => {
  if (ms < 0) return "0s";
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ${seconds % 60}s`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m`;
};

const readCodexRecords = async (filePath: string): Promise<CodexRecord[]> => {
  const records: CodexRecord[] = [];
  const stream = createReadStream(filePath, { encoding: "utf-8" });
  const rl = createInterface({ input: stream, crlfDelay: Infinity });

  try {
    for await (const line of rl) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        records.push(JSON.parse(trimmed) as CodexRecord);
      } catch {
        // Skip malformed lines
      }
    }
  } finally {
    stream.destroy();
  }

  return records;
};

const buildCodexTurns = (records: CodexRecord[]): ProcessedTurn[] => {
  const toolResults = new Map<string, { content: string; isError: boolean }>();

  for (const record of records) {
    const payload = record.payload;
    if (record.type !== "response_item" || payload?.type !== "function_call_output") continue;
    if (typeof payload.call_id !== "string") continue;
    const output = typeof payload.output === "string" ? payload.output : JSON.stringify(payload.output ?? "");
    toolResults.set(payload.call_id, { content: output, isError: false });
  }

  const turns: ProcessedTurn[] = [];

  for (const record of records) {
    const payload = record.payload;
    if (record.type !== "response_item" || !payload) continue;
    const timestamp = record.timestamp ?? new Date().toISOString();

    if (payload.type === "message" && (payload.role === "user" || payload.role === "assistant")) {
      const text = extractText(payload.content).trim();
      if (!text) continue;
      if (payload.role === "user" && isInternalText(text)) continue;
      turns.push({
        role: payload.role,
        timestamp,
        content: [{ type: "text", text }],
      });
      continue;
    }

    if (payload.type === "function_call" && typeof payload.call_id === "string") {
      const tool: ToolCall = {
        id: payload.call_id,
        name: typeof payload.name === "string" ? payload.name : "tool",
        input: parseToolInput(payload.arguments),
        result: toolResults.get(payload.call_id),
      };
      const content: ContentBlock[] = [{ type: "tool_call", tool }];
      turns.push({ role: "assistant", timestamp, content });
    }
  }

  return turns;
};

const getCodexMetadata = (opts: {
  filePath: string;
  records: CodexRecord[];
  turns: ProcessedTurn[];
}): CodexMetadata => {
  const metadata: CodexMetadata = {
    sessionId: basename(opts.filePath, ".jsonl"),
  };

  for (const record of opts.records) {
    const payload = record.payload;
    if (record.type === "session_meta" && payload) {
      if (typeof payload.id === "string") metadata.sessionId = payload.id;
      if (typeof payload.cwd === "string") metadata.cwd = payload.cwd;
      if (payload.git && typeof payload.git === "object" && typeof payload.git.branch === "string") {
        metadata.gitBranch = payload.git.branch;
      }
    }
    if (record.type === "turn_context" && payload) {
      if (!metadata.cwd && typeof payload.cwd === "string") metadata.cwd = payload.cwd;
      if (typeof payload.model === "string") metadata.model = payload.model;
    }
  }

  metadata.firstTimestamp = opts.turns[0]?.timestamp ?? opts.records[0]?.timestamp;
  metadata.lastTimestamp =
    opts.turns[opts.turns.length - 1]?.timestamp ?? opts.records[opts.records.length - 1]?.timestamp;
  return metadata;
};

const computeThreadMetadata = (opts: {
  metadata: CodexMetadata;
  turns: ProcessedTurn[];
}): ThreadMetadata => {
  const firstUserTurn = opts.turns.find((turn) => turn.role === "user");
  const firstText = firstUserTurn?.content.find((block) => block.type === "text");
  const title =
    firstText && firstText.type === "text"
      ? `${firstText.text.slice(0, 100)}${firstText.text.length > 100 ? "..." : ""}`
      : "Untitled session";
  const start = new Date(opts.metadata.firstTimestamp ?? new Date().toISOString());
  const end = new Date(opts.metadata.lastTimestamp ?? start.toISOString());
  const toolsUsed = new Set<string>();

  for (const turn of opts.turns) {
    for (const block of turn.content) {
      if (block.type === "tool_call") toolsUsed.add(block.tool.name);
    }
  }

  return {
    sessionId: opts.metadata.sessionId,
    source: "codex",
    title,
    projectName: opts.metadata.cwd ? basename(opts.metadata.cwd) : "unknown",
    gitBranch: opts.metadata.gitBranch,
    created: start.toISOString(),
    duration: formatDuration(end.getTime() - start.getTime()),
    totalTokens: { input: 0, output: 0 },
    models: opts.metadata.model ? [opts.metadata.model] : [],
    toolsUsed: [...toolsUsed],
    messageCount: opts.turns.length,
    visibility: "private",
  };
};

const parseCodexSession = async ({
  filePath,
  uploader,
}: {
  filePath: string;
  uploader: Uploader;
}): Promise<ThreadData> => {
  const records = await readCodexRecords(filePath);
  const turns = buildCodexTurns(records);
  if (turns.length === 0) {
    throw new Error("Session contains no messages");
  }

  const metadata = getCodexMetadata({ filePath, records, turns });
  const sanitizeOpts: SanitizeOptions = {
    homePath: homedir(),
    projectPath: metadata.cwd,
  };
  const sanitizedTurns = sanitizeTurns({ turns, options: sanitizeOpts });

  return {
    version: 1,
    metadata: computeThreadMetadata({ metadata, turns: sanitizedTurns }),
    uploader,
    turns: sanitizedTurns,
  };
};

export { parseCodexSession };
