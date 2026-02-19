import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { getConfigDir } from "../auth/config";

type IndexEntry = {
  sessionId: string;
  projectPath: string;
  firstMessage: string;
  messageCount: number;
  created: string;
  lastModified: string;
  sizeBytes: number;
  mtimeMs: number;
};

type SessionIndex = {
  version: 1;
  entries: Record<string, IndexEntry>;
};

const INDEX_DIR = getConfigDir();
const INDEX_PATH = join(INDEX_DIR, "session-index.json");

const loadIndex = async (): Promise<SessionIndex> => {
  try {
    const raw = await readFile(INDEX_PATH, "utf-8");
    const parsed = JSON.parse(raw);
    if (parsed.version === 1 && parsed.entries) return parsed;
  } catch {
    // Missing or corrupt file
  }
  return { version: 1, entries: {} };
};

const saveIndex = async (opts: { index: SessionIndex }): Promise<void> => {
  await mkdir(INDEX_DIR, { recursive: true });
  await writeFile(INDEX_PATH, JSON.stringify(opts.index), "utf-8");
};

export { loadIndex, saveIndex, type IndexEntry, type SessionIndex };
