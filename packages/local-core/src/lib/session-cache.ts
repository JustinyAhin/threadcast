type CacheEntry = {
  mtimeMs: number;
  size: number;
  firstMessage: string;
  messageCount: number;
};

type SessionCache = {
  get: (filePath: string) => CacheEntry | undefined;
  set: (opts: { filePath: string; entry: CacheEntry }) => void;
  entries: () => IterableIterator<[string, CacheEntry]>;
  clear: () => void;
};

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

export { createSessionCache, type CacheEntry, type SessionCache };
