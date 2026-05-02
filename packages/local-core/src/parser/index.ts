import { readSessionMessages } from "./jsonl-reader.js";
import { buildMessageChain } from "./message-chain.js";
import { processMessages } from "./tool-matcher.js";
import { sanitizeTurns } from "./sanitizer.js";
import { parseCodexSession } from "./codex.js";
import type {
  ThreadData,
  ThreadMetadata,
  ProcessedTurn,
  Uploader,
  SessionSource,
} from "@threadcast/shared";
import { homedir } from "node:os";
import { basename } from "node:path";
import type { SanitizeOptions } from "../types.js";

type ComputeMetadataOpts = {
  sessionId: string;
  projectName: string;
  gitBranch: string | undefined;
  turns: ProcessedTurn[];
  firstTimestamp: string;
  lastTimestamp: string;
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

const computeMetadata = (opts: ComputeMetadataOpts): ThreadMetadata => {
  let totalInput = 0;
  let totalOutput = 0;
  const models = new Set<string>();
  const toolsUsed = new Set<string>();
  let messageCount = 0;

  for (const turn of opts.turns) {
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

  const start = new Date(opts.firstTimestamp);
  const end = new Date(opts.lastTimestamp);
  const durationMs = end.getTime() - start.getTime();
  const duration = formatDuration(durationMs);

  const firstUserTurn = opts.turns.find((t) => t.role === "user");
  const firstText = firstUserTurn?.content.find((b) => b.type === "text");
  let title = "Untitled session";
  if (firstText && firstText.type === "text") {
    title = firstText.text.slice(0, 100);
    if (firstText.text.length > 100) title += "...";
  }

  return {
    sessionId: opts.sessionId,
    title,
    projectName: opts.projectName,
    gitBranch: opts.gitBranch,
    created: opts.firstTimestamp,
    duration,
    totalTokens: { input: totalInput, output: totalOutput },
    models: [...models],
    toolsUsed: [...toolsUsed],
    messageCount,
    visibility: "private",
  };
};

const parseSession = async ({
  filePath,
  source = "claude-code",
  uploader,
}: {
  filePath: string;
  source?: SessionSource;
  uploader: Uploader;
}): Promise<ThreadData> => {
  if (source === "codex") {
    return parseCodexSession({ filePath, uploader });
  }

  const rawMessages = await readSessionMessages(filePath);
  if (rawMessages.length === 0) {
    throw new Error("Session contains no messages");
  }

  const chain = buildMessageChain(rawMessages);

  const firstMsg = chain[0];
  const lastMsg = chain[chain.length - 1];
  const sessionId = firstMsg.sessionId || basename(filePath, ".jsonl");

  const cwd = firstMsg.cwd || "";
  const projectName = cwd ? basename(cwd) : "unknown";

  const turns = processMessages(chain);

  const sanitizeOpts: SanitizeOptions = {
    homePath: homedir(),
    projectPath: cwd || undefined,
  };
  const sanitizedTurns = sanitizeTurns({
    turns,
    options: sanitizeOpts,
  });

  const metadata = computeMetadata({
    sessionId,
    projectName,
    gitBranch: firstMsg.gitBranch,
    turns: sanitizedTurns,
    firstTimestamp: firstMsg.timestamp,
    lastTimestamp: lastMsg.timestamp,
  });

  return {
    version: 1,
    metadata,
    uploader,
    turns: sanitizedTurns,
  };
};

export { parseSession };
