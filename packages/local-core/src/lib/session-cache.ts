import type { CacheEntry, SessionCache } from "../types.js";

const createSessionCache = (): SessionCache => {
  const map = new Map<string, CacheEntry>();

  return {
    get: (filePath) => map.get(filePath),
    set: ({ filePath, entry }) => {
      map.set(filePath, entry);
    },
    entries: () => map.entries(),
    clear: () => map.clear(),
  };
};

export { createSessionCache };
