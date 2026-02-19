import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { getConfigDir } from "../auth/config";

type SharedSessionEntry = {
  url: string;
  sharedAt: string;
};

type SharedSessionsMap = Record<string, SharedSessionEntry>;

const SHARED_FILE = join(getConfigDir(), "shared.json");

const loadSharedSessions = async (): Promise<SharedSessionsMap> => {
  try {
    const raw = await readFile(SHARED_FILE, "utf-8");
    return JSON.parse(raw) as SharedSessionsMap;
  } catch {
    return {};
  }
};

const saveSharedSession = async (opts: {
  sessionId: string;
  url: string;
}): Promise<void> => {
  const existing = await loadSharedSessions();
  existing[opts.sessionId] = {
    url: opts.url,
    sharedAt: new Date().toISOString(),
  };
  await mkdir(getConfigDir(), { recursive: true });
  await writeFile(SHARED_FILE, JSON.stringify(existing, null, 2));
};

export { loadSharedSessions, saveSharedSession, type SharedSessionEntry, type SharedSessionsMap };
