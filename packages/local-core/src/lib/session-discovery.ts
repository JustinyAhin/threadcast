import { readdir, stat } from "node:fs/promises";
import { join, basename } from "node:path";
import { homedir } from "node:os";
import { createReadStream } from "node:fs";
import { createInterface } from "node:readline";
import type { SessionSource, SessionSummary } from "@threadcast/shared";
import { createSessionCache } from "./session-cache.js";
import { loadIndex, saveIndex } from "./session-index.js";
import { normalizeClaudeCommandText } from "../parser/claude-command.js";
import type { IndexEntry } from "../types.js";

const CLAUDE_PROJECTS_DIR = join(homedir(), ".claude", "projects");
const CODEX_SESSIONS_DIR = join(homedir(), ".codex", "sessions");

const sessionCache = createSessionCache();

type ScanResult = {
  sessionId?: string;
  projectPath?: string;
  gitBranch?: string;
  firstMessage: string | null;
  messageCount: number;
};

const scanClaudeSessionFile = async (
  filePath: string
): Promise<ScanResult> => {
  const stream = createReadStream(filePath, { encoding: "utf-8" });
  const rl = createInterface({ input: stream, crlfDelay: Infinity });

  let firstMessage: string | null = null;
  let messageCount = 0;

  try {
    for await (const line of rl) {
      try {
        const data = JSON.parse(line.trim());

        if (data.isSidechain || data.isMeta) continue;
        if (data.type !== "user" && data.type !== "assistant") continue;

        messageCount++;

        if (
          firstMessage === null &&
          data.type === "user" &&
          !data.toolUseResult &&
          !data.sourceToolAssistantUUID &&
          data.message
        ) {
          const content = data.message.content;
          if (typeof content === "string") {
            firstMessage = normalizeClaudeCommandText(content).slice(0, 100);
          } else if (Array.isArray(content)) {
            const textBlock = content.find(
              (b: any) => b.type === "text" && b.text
            );
            if (textBlock) {
              firstMessage = normalizeClaudeCommandText(textBlock.text).slice(0, 100);
            }
          }
        }
      } catch {
        continue;
      }
    }
  } finally {
    stream.destroy();
  }

  return { firstMessage, messageCount };
};

const extractCodexText = (content: unknown): string => {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  return content
    .map((block) => {
      if (!block || typeof block !== "object") return "";
      const data = block as { type?: unknown; text?: unknown };
      if (
        (data.type === "input_text" || data.type === "output_text" || data.type === "text") &&
        typeof data.text === "string"
      ) {
        return data.text;
      }
      return "";
    })
    .filter(Boolean)
    .join("\n");
};

const CODEX_INTERNAL_PREFIXES = ["# AGENTS.md instructions", "<environment_context>"];

const isCodexInternalText = (text: string): boolean => {
  const trimmed = text.trim();
  return CODEX_INTERNAL_PREFIXES.some((prefix) => trimmed.startsWith(prefix));
};

const scanCodexSessionFile = async (filePath: string): Promise<ScanResult> => {
  const stream = createReadStream(filePath, { encoding: "utf-8" });
  const rl = createInterface({ input: stream, crlfDelay: Infinity });

  let sessionId: string | undefined;
  let projectPath: string | undefined;
  let gitBranch: string | undefined;
  let firstMessage: string | null = null;
  let messageCount = 0;

  try {
    for await (const line of rl) {
      try {
        const data = JSON.parse(line.trim());
        const payload = data.payload;

        if (data.type === "session_meta" && payload && typeof payload === "object") {
          if (typeof payload.id === "string") sessionId = payload.id;
          if (typeof payload.cwd === "string") projectPath = payload.cwd;
          if (payload.git && typeof payload.git === "object") {
            const git = payload.git as { branch?: unknown };
            if (typeof git.branch === "string") gitBranch = git.branch;
          }
          continue;
        }

        if (data.type === "turn_context" && payload && typeof payload === "object") {
          if (!projectPath && typeof payload.cwd === "string") projectPath = payload.cwd;
          continue;
        }

        if (data.type !== "response_item" || !payload || typeof payload !== "object") {
          continue;
        }

        if (payload.type === "message" && (payload.role === "user" || payload.role === "assistant")) {
          const text = extractCodexText(payload.content);
          if (payload.role === "user" && isCodexInternalText(text)) continue;
          if (!text.trim()) continue;
          messageCount++;
          if (firstMessage === null && payload.role === "user") {
            firstMessage = text.slice(0, 100);
          }
        } else if (payload.type === "function_call") {
          messageCount++;
        }
      } catch {
        continue;
      }
    }
  } finally {
    stream.destroy();
  }

  return { sessionId, projectPath, gitBranch, firstMessage, messageCount };
};

const listJsonlFiles = async (dir: string): Promise<string[]> => {
  const entries = await readdir(dir, { withFileTypes: true }).catch(() => []);
  const files: string[] = [];

  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listJsonlFiles(path)));
    } else if (entry.isFile() && entry.name.endsWith(".jsonl")) {
      files.push(path);
    }
  }

  return files;
};

const pushSession = (opts: {
  sessions: SessionSummary[];
  filePath: string;
  fileStat: Awaited<ReturnType<typeof stat>>;
  sessionId: string;
  source: SessionSource;
  projectPath: string;
  firstMessage: string;
  messageCount: number;
}) => {
  opts.sessions.push({
    sessionId: opts.sessionId,
    source: opts.source,
    path: opts.filePath,
    projectPath: opts.projectPath,
    firstMessage: opts.firstMessage,
    messageCount: opts.messageCount,
    created: opts.fileStat.birthtime.toISOString(),
    lastModified: opts.fileStat.mtime.toISOString(),
    sizeBytes: Number(opts.fileStat.size),
  });
};

const discoverSessionsForSource = async (opts: {
  source: SessionSource;
  files: string[];
  projectPathForFile: (filePath: string) => string;
  sessionIdForFile: (filePath: string) => string;
  scanFile: (filePath: string) => Promise<ScanResult>;
  persistedEntries: Record<string, IndexEntry>;
  newIndexEntries: Record<string, IndexEntry>;
  sessions: SessionSummary[];
}): Promise<boolean> => {
  let indexDirty = false;

  for (const filePath of opts.files) {
    const fileStat = await stat(filePath).catch(() => null);
    if (!fileStat) continue;

    const fallbackProjectPath = opts.projectPathForFile(filePath);
    const fallbackSessionId = opts.sessionIdForFile(filePath);

    const memCached = sessionCache.get(filePath);
    if (memCached && memCached.mtimeMs === fileStat.mtimeMs && memCached.size === fileStat.size) {
      if (memCached.messageCount === 0) continue;

      const indexed = opts.persistedEntries[filePath];
      const sessionId = indexed?.sessionId ?? fallbackSessionId;
      const projectPath = indexed?.projectPath ?? fallbackProjectPath;
      opts.newIndexEntries[filePath] = {
        sessionId,
        source: opts.source,
        projectPath,
        firstMessage: memCached.firstMessage,
        messageCount: memCached.messageCount,
        created: fileStat.birthtime.toISOString(),
        lastModified: fileStat.mtime.toISOString(),
        sizeBytes: fileStat.size,
        mtimeMs: fileStat.mtimeMs,
      };
      pushSession({
        sessions: opts.sessions,
        filePath,
        fileStat,
        sessionId,
        source: opts.source,
        projectPath,
        firstMessage: memCached.firstMessage,
        messageCount: memCached.messageCount,
      });
      continue;
    }

    const indexed = opts.persistedEntries[filePath];
    if (
      indexed &&
      indexed.mtimeMs === fileStat.mtimeMs &&
      indexed.sizeBytes === fileStat.size &&
      (!indexed.source || indexed.source === opts.source)
    ) {
      if (indexed.messageCount === 0) continue;

      const cacheEntry = {
        mtimeMs: fileStat.mtimeMs,
        size: fileStat.size,
        firstMessage: indexed.firstMessage,
        messageCount: indexed.messageCount,
      };
      sessionCache.set({ filePath, entry: cacheEntry });
      opts.newIndexEntries[filePath] = { ...indexed, source: opts.source };
      pushSession({
        sessions: opts.sessions,
        filePath,
        fileStat,
        sessionId: indexed.sessionId,
        source: opts.source,
        projectPath: indexed.projectPath,
        firstMessage: indexed.firstMessage,
        messageCount: indexed.messageCount,
      });
      continue;
    }

    indexDirty = true;
    const result = await opts.scanFile(filePath);
    if (result.messageCount === 0) continue;

    const sessionId = result.sessionId ?? fallbackSessionId;
    const projectPath = result.projectPath ?? fallbackProjectPath;
    const firstMessage = result.firstMessage || "(empty session)";
    const cacheEntry = {
      mtimeMs: fileStat.mtimeMs,
      size: fileStat.size,
      firstMessage,
      messageCount: result.messageCount,
    };
    sessionCache.set({ filePath, entry: cacheEntry });
    opts.newIndexEntries[filePath] = {
      sessionId,
      source: opts.source,
      projectPath,
      firstMessage,
      messageCount: result.messageCount,
      created: fileStat.birthtime.toISOString(),
      lastModified: fileStat.mtime.toISOString(),
      sizeBytes: fileStat.size,
      mtimeMs: fileStat.mtimeMs,
    };
    pushSession({
      sessions: opts.sessions,
      filePath,
      fileStat,
      sessionId,
      source: opts.source,
      projectPath,
      firstMessage,
      messageCount: result.messageCount,
    });
  }

  return indexDirty;
};

const discoverSessions = async (): Promise<SessionSummary[]> => {
  const sessions: SessionSummary[] = [];
  const persistedIndex = await loadIndex();
  const newIndexEntries: Record<string, IndexEntry> = {};
  let indexDirty = false;

  const projectDirs = await readdir(CLAUDE_PROJECTS_DIR).catch(() => []);
  for (const projectDir of projectDirs) {
    const projectPath = join(CLAUDE_PROJECTS_DIR, projectDir);
    const dirStat = await stat(projectPath).catch(() => null);
    if (!dirStat?.isDirectory()) continue;

    let files: string[];
    try {
      files = await readdir(projectPath);
    } catch {
      continue;
    }

    const sourceDirty = await discoverSessionsForSource({
      source: "claude-code",
      files: files.filter((file) => file.endsWith(".jsonl")).map((file) => join(projectPath, file)),
      projectPathForFile: () => projectDir.replace(/-/g, "/"),
      sessionIdForFile: (filePath) => basename(filePath, ".jsonl"),
      scanFile: scanClaudeSessionFile,
      persistedEntries: persistedIndex.entries,
      newIndexEntries,
      sessions,
    });
    indexDirty = indexDirty || sourceDirty;
  }

  const codexFiles = await listJsonlFiles(CODEX_SESSIONS_DIR);
  const codexDirty = await discoverSessionsForSource({
    source: "codex",
    files: codexFiles,
    projectPathForFile: () => "",
    sessionIdForFile: (filePath) => basename(filePath, ".jsonl"),
    scanFile: scanCodexSessionFile,
    persistedEntries: persistedIndex.entries,
    newIndexEntries,
    sessions,
  });
  indexDirty = indexDirty || codexDirty;

  const keysChanged =
    indexDirty ||
    Object.keys(newIndexEntries).length !==
      Object.keys(persistedIndex.entries).length;
  if (keysChanged) {
    saveIndex({ index: { version: 1, entries: newIndexEntries } }).catch(
      () => {}
    );
  }

  sessions.sort(
    (a, b) =>
      new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime()
  );

  return sessions;
};

const findSession = async (
  opts: { sessionId: string; source?: SessionSource } | string
): Promise<SessionSummary | null> => {
  const sessionId = typeof opts === "string" ? opts : opts.sessionId;
  const source = typeof opts === "string" ? undefined : opts.source;
  const sessions = await discoverSessions();
  return sessions.find((s) => s.sessionId === sessionId && (!source || s.source === source)) || null;
};

export { discoverSessions, findSession, scanClaudeSessionFile, scanCodexSessionFile };
