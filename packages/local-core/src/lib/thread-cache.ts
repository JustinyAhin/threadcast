import { stat } from "node:fs/promises";
import type { SessionSource, ThreadData } from "@threadcast/shared";
import { parseSession } from "../parser/index.js";
import { createLruCache } from "./lru-cache.js";

type Uploader = {
  githubId?: string;
  githubUsername: string;
  githubAvatarUrl: string;
};

const threadLru = createLruCache<ThreadData>({ maxSize: 3 });

const getCachedThread = async (opts: {
  filePath: string;
  source?: SessionSource;
  uploader: Uploader;
}): Promise<ThreadData> => {
  const { filePath, source = "claude-code", uploader } = opts;
  const fileStat = await stat(filePath);
  const key = `${source}:${filePath}:${fileStat.mtimeMs}`;

  const cached = threadLru.get(key);
  if (cached) {
    return { ...cached, uploader };
  }

  const data = await parseSession({ filePath, source, uploader });
  threadLru.set({ key, value: data });
  return data;
};

export { getCachedThread };
