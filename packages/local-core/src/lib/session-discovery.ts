import { readdir, stat } from "node:fs/promises";
import { join, basename } from "node:path";
import { homedir } from "node:os";
import { createReadStream } from "node:fs";
import { createInterface } from "node:readline";
import type { SessionSummary } from "@threadcast/shared";
import { createSessionCache } from "./session-cache.js";
import { loadIndex, saveIndex, type IndexEntry } from "./session-index.js";

const CLAUDE_PROJECTS_DIR = join(homedir(), ".claude", "projects");

const sessionCache = createSessionCache();

const scanSessionFile = async (
  filePath: string
): Promise<{ firstMessage: string | null; messageCount: number }> => {
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
            firstMessage = content.slice(0, 100);
          } else if (Array.isArray(content)) {
            const textBlock = content.find(
              (b: any) => b.type === "text" && b.text
            );
            if (textBlock) firstMessage = textBlock.text.slice(0, 100);
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

const discoverSessions = async (): Promise<SessionSummary[]> => {
  const sessions: SessionSummary[] = [];

  let projectDirs: string[];
  try {
    projectDirs = await readdir(CLAUDE_PROJECTS_DIR);
  } catch {
    return [];
  }

  const persistedIndex = await loadIndex();
  const newIndexEntries: Record<string, IndexEntry> = {};
  const newCache = createSessionCache();
  let indexDirty = false;

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

    for (const file of files) {
      if (!file.endsWith(".jsonl")) continue;
      const filePath = join(projectPath, file);
      const fileStat = await stat(filePath).catch(() => null);
      if (!fileStat) continue;

      const decodedProjectPath = projectDir.replace(/-/g, "/");
      const sessionId = basename(file, ".jsonl");

      const memCached = sessionCache.get(filePath);
      if (
        memCached &&
        memCached.mtimeMs === fileStat.mtimeMs &&
        memCached.size === fileStat.size
      ) {
        if (memCached.messageCount === 0) continue;

        newCache.set({
          filePath,
          entry: memCached,
        });
        newIndexEntries[filePath] = {
          sessionId,
          projectPath: decodedProjectPath,
          firstMessage: memCached.firstMessage,
          messageCount: memCached.messageCount,
          created: fileStat.birthtime.toISOString(),
          lastModified: fileStat.mtime.toISOString(),
          sizeBytes: fileStat.size,
          mtimeMs: fileStat.mtimeMs,
        };
        sessions.push({
          sessionId,
          path: filePath,
          projectPath: decodedProjectPath,
          firstMessage: memCached.firstMessage,
          messageCount: memCached.messageCount,
          created: fileStat.birthtime.toISOString(),
          lastModified: fileStat.mtime.toISOString(),
          sizeBytes: fileStat.size,
        });
        continue;
      }

      const indexed = persistedIndex.entries[filePath];
      if (indexed && indexed.mtimeMs === fileStat.mtimeMs && indexed.sizeBytes === fileStat.size) {
        if (indexed.messageCount === 0) continue;

        const cacheEntry = {
          mtimeMs: fileStat.mtimeMs,
          size: fileStat.size,
          firstMessage: indexed.firstMessage,
          messageCount: indexed.messageCount,
        };
        newCache.set({ filePath, entry: cacheEntry });
        newIndexEntries[filePath] = indexed;
        sessions.push({
          sessionId,
          path: filePath,
          projectPath: decodedProjectPath,
          firstMessage: indexed.firstMessage,
          messageCount: indexed.messageCount,
          created: indexed.created,
          lastModified: indexed.lastModified,
          sizeBytes: indexed.sizeBytes,
        });
        continue;
      }

      indexDirty = true;
      const result = await scanSessionFile(filePath);
      const firstMessage = result.firstMessage || "(empty session)";

      if (result.messageCount === 0) continue;

      const cacheEntry = {
        mtimeMs: fileStat.mtimeMs,
        size: fileStat.size,
        firstMessage,
        messageCount: result.messageCount,
      };
      newCache.set({ filePath, entry: cacheEntry });
      newIndexEntries[filePath] = {
        sessionId,
        projectPath: decodedProjectPath,
        firstMessage,
        messageCount: result.messageCount,
        created: fileStat.birthtime.toISOString(),
        lastModified: fileStat.mtime.toISOString(),
        sizeBytes: fileStat.size,
        mtimeMs: fileStat.mtimeMs,
      };
      sessions.push({
        sessionId,
        path: filePath,
        projectPath: decodedProjectPath,
        firstMessage,
        messageCount: result.messageCount,
        created: fileStat.birthtime.toISOString(),
        lastModified: fileStat.mtime.toISOString(),
        sizeBytes: fileStat.size,
      });
    }
  }

  sessionCache.clear();
  for (const [path, entry] of newCache.entries()) {
    sessionCache.set({ filePath: path, entry });
  }

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
  sessionId: string
): Promise<SessionSummary | null> => {
  for (const [filePath, entry] of sessionCache.entries()) {
    if (basename(filePath, ".jsonl") === sessionId) {
      const fileStat = await stat(filePath).catch(() => null);
      if (!fileStat) continue;
      const projectDir = basename(join(filePath, ".."));
      return {
        sessionId,
        path: filePath,
        projectPath: projectDir.replace(/-/g, "/"),
        firstMessage: entry.firstMessage,
        messageCount: entry.messageCount,
        created: fileStat.birthtime.toISOString(),
        lastModified: fileStat.mtime.toISOString(),
        sizeBytes: fileStat.size,
      };
    }
  }

  const sessions = await discoverSessions();
  return sessions.find((s) => s.sessionId === sessionId) || null;
};

export { discoverSessions, findSession, scanSessionFile };
