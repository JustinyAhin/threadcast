import { readSessionMessages } from "./jsonl-reader.js";
import { buildMessageChain } from "./message-chain.js";
import { processMessages } from "./tool-matcher.js";
import { sanitizeTurns, type SanitizeOptions } from "./sanitizer.js";
import type {
  ThreadData,
  ThreadMetadata,
  ProcessedTurn,
  Uploader,
} from "@threadcast/shared";
import { homedir } from "node:os";
import { basename, dirname } from "node:path";

export { readSessionMessages } from "./jsonl-reader.js";
export { buildMessageChain } from "./message-chain.js";
export { processMessages } from "./tool-matcher.js";
export { sanitizeTurns } from "./sanitizer.js";

/**
 * Parse a Claude Code JSONL session file into a ThreadData object.
 */
export async function parseSession(
  filePath: string,
  uploader: Uploader
): Promise<ThreadData> {
  // 1. Read and filter messages
  const rawMessages = await readSessionMessages(filePath);
  if (rawMessages.length === 0) {
    throw new Error("Session contains no messages");
  }

  // 2. Build chronological chain
  const chain = buildMessageChain(rawMessages);

  // 3. Extract session metadata from first message
  const firstMsg = chain[0];
  const lastMsg = chain[chain.length - 1];
  const sessionId = firstMsg.sessionId || basename(filePath, ".jsonl");

  // Detect project path from CWD
  const cwd = firstMsg.cwd || "";
  const projectName = cwd ? basename(cwd) : "unknown";

  // 4. Process into turns (group messages, match tools)
  const turns = processMessages(chain);

  // 5. Sanitize (strip paths, truncate outputs)
  const sanitizeOpts: SanitizeOptions = {
    homePath: homedir(),
    projectPath: cwd || undefined,
  };
  const sanitizedTurns = sanitizeTurns(turns, sanitizeOpts);

  // 6. Compute metadata
  const metadata = computeMetadata(
    sessionId,
    projectName,
    firstMsg.gitBranch,
    sanitizedTurns,
    firstMsg.timestamp,
    lastMsg.timestamp
  );

  return {
    version: 1,
    metadata,
    uploader,
    turns: sanitizedTurns,
  };
}

function computeMetadata(
  sessionId: string,
  projectName: string,
  gitBranch: string | undefined,
  turns: ProcessedTurn[],
  firstTimestamp: string,
  lastTimestamp: string
): ThreadMetadata {
  let totalInput = 0;
  let totalOutput = 0;
  const models = new Set<string>();
  const toolsUsed = new Set<string>();
  let messageCount = 0;

  for (const turn of turns) {
    messageCount++;
    if (turn.metadata?.usage) {
      totalInput += turn.metadata.usage.input_tokens;
      totalOutput += turn.metadata.usage.output_tokens;
    }
    if (turn.metadata?.model) {
      models.add(turn.metadata.model);
    }
    for (const block of turn.content) {
      if (block.type === "tool_call") {
        toolsUsed.add(block.tool.name);
      }
    }
  }

  // Compute duration
  const start = new Date(firstTimestamp);
  const end = new Date(lastTimestamp);
  const durationMs = end.getTime() - start.getTime();
  const duration = formatDuration(durationMs);

  // Generate title from first user message
  const firstUserTurn = turns.find((t) => t.role === "user");
  const firstText = firstUserTurn?.content.find((b) => b.type === "text");
  let title = "Untitled session";
  if (firstText && firstText.type === "text") {
    title = firstText.text.slice(0, 100);
    if (firstText.text.length > 100) title += "...";
  }

  return {
    sessionId,
    title,
    projectName,
    gitBranch,
    created: firstTimestamp,
    duration,
    totalTokens: { input: totalInput, output: totalOutput },
    models: [...models],
    toolsUsed: [...toolsUsed],
    messageCount,
  };
}

function formatDuration(ms: number): string {
  if (ms < 0) return "0s";
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ${seconds % 60}s`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m`;
}
