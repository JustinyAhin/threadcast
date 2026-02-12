type LruCache<T> = {
  get: (key: string) => T | undefined;
  set: (opts: { key: string; value: T }) => void;
  clear: () => void;
};

const createLruCache = <T>(opts: { maxSize: number }): LruCache<T> => {
  const { maxSize } = opts;
  const map = new Map<string, T>();

  return {
    get: (key) => {
      const value = map.get(key);
      if (value === undefined) return undefined;
      // Move to end (most recently used)
      map.delete(key);
      map.set(key, value);
      return value;
    },
    set: ({ key, value }) => {
      map.delete(key);
      map.set(key, value);
      // Evict oldest if over capacity
      if (map.size > maxSize) {
        const firstKey = map.keys().next().value!;
        map.delete(firstKey);
      }
    },
    clear: () => map.clear(),
  };
};

export { createLruCache, type LruCache };
