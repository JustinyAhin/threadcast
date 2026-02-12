import { readdir, stat } from "node:fs/promises";
import { join, basename } from "node:path";
import { homedir } from "node:os";
import { createReadStream } from "node:fs";
import { createInterface } from "node:readline";
import type { SessionSummary } from "@threadcast/shared";

const CLAUDE_PROJECTS_DIR = join(homedir(), ".claude", "projects");

/**
 * Scan all Claude Code project directories for session files.
 */
export async function discoverSessions(): Promise<SessionSummary[]> {
  const sessions: SessionSummary[] = [];

  let projectDirs: string[];
  try {
    projectDirs = await readdir(CLAUDE_PROJECTS_DIR);
  } catch {
    return [];
  }

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

      // Read first user message for preview
      const firstMessage = await getFirstUserMessage(filePath);
      const messageCount = await countMessages(filePath);

      if (messageCount === 0) continue;

      // Decode project path from directory name
      const decodedProjectPath = projectDir.replace(/-/g, "/");

      sessions.push({
        sessionId: basename(file, ".jsonl"),
        path: filePath,
        projectPath: decodedProjectPath,
        firstMessage: firstMessage || "(empty session)",
        messageCount,
        created: fileStat.birthtime.toISOString(),
        lastModified: fileStat.mtime.toISOString(),
        sizeBytes: fileStat.size,
      });
    }
  }

  // Sort by last modified, newest first
  sessions.sort(
    (a, b) =>
      new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime()
  );

  return sessions;
}

/**
 * Find a session by ID across all project directories.
 */
export async function findSession(
  sessionId: string
): Promise<SessionSummary | null> {
  const sessions = await discoverSessions();
  return sessions.find((s) => s.sessionId === sessionId) || null;
}

async function getFirstUserMessage(filePath: string): Promise<string | null> {
  const stream = createReadStream(filePath, { encoding: "utf-8" });
  const rl = createInterface({ input: stream, crlfDelay: Infinity });

  try {
    for await (const line of rl) {
      try {
        const data = JSON.parse(line.trim());
        if (
          data.type === "user" &&
          !data.toolUseResult &&
          !data.sourceToolAssistantUUID &&
          data.message
        ) {
          const content = data.message.content;
          if (typeof content === "string") return content.slice(0, 100);
          if (Array.isArray(content)) {
            const textBlock = content.find(
              (b: any) => b.type === "text" && b.text
            );
            if (textBlock) return textBlock.text.slice(0, 100);
          }
        }
      } catch {
        continue;
      }
    }
  } finally {
    stream.destroy();
  }
  return null;
}

async function countMessages(filePath: string): Promise<number> {
  const stream = createReadStream(filePath, { encoding: "utf-8" });
  const rl = createInterface({ input: stream, crlfDelay: Infinity });
  let count = 0;

  try {
    for await (const line of rl) {
      try {
        const data = JSON.parse(line.trim());
        if (
          (data.type === "user" || data.type === "assistant") &&
          !data.isSidechain &&
          !data.isMeta
        ) {
          count++;
        }
      } catch {
        continue;
      }
    }
  } finally {
    stream.destroy();
  }

  return count;
}
