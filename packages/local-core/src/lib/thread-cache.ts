import { stat } from "node:fs/promises";
import type { ThreadData } from "@threadcast/shared";
import { parseSession } from "../parser/index.js";
import { createLruCache } from "./lru-cache.js";

type Uploader = {
  githubUsername: string;
  githubAvatarUrl: string;
};

const threadLru = createLruCache<ThreadData>({ maxSize: 3 });

const getCachedThread = async (opts: {
  filePath: string;
  uploader: Uploader;
}): Promise<ThreadData> => {
  const { filePath, uploader } = opts;
  const fileStat = await stat(filePath);
  const key = `${filePath}:${fileStat.mtimeMs}`;

  const cached = threadLru.get(key);
  if (cached) {
    return { ...cached, uploader };
  }

  const data = await parseSession({ filePath, uploader });
  threadLru.set({ key, value: data });
  return data;
};

export { getCachedThread };
