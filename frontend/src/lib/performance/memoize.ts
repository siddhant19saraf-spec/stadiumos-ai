// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Fn = (...args: any[]) => any;

interface MemoizeOptions {
  maxSize?: number;
  ttlMs?: number;
  keyFn?: (...args: Parameters<Fn>) => string;
}

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const DEFAULT_MAX_SIZE = 100;

export function memoize<T extends Fn>(fn: T, options: MemoizeOptions = {}): T {
  const { maxSize = DEFAULT_MAX_SIZE, ttlMs, keyFn } = options;
  const cache = new Map<string, CacheEntry<ReturnType<T>>>();

  return ((...args: any[]) => {
    const key = keyFn ? keyFn(...args) : JSON.stringify(args);
    const now = Date.now();
    const existing = cache.get(key);

    if (existing) {
      if (ttlMs === undefined || now < existing.expiresAt) {
        return existing.value;
      }
      cache.delete(key);
    }

    const result = fn(...args);
    cache.set(key, { value: result, expiresAt: now + (ttlMs ?? Infinity) });

    if (cache.size > maxSize) {
      const firstKey = cache.keys().next().value;
      if (firstKey !== undefined) cache.delete(firstKey);
    }

    return result;
  }) as T;
}

export async function memoizeAsync<T extends (...args: Parameters<Fn>) => Promise<unknown>>(
  fn: T,
  options: MemoizeOptions = {},
): Promise<T> {
  const { maxSize = DEFAULT_MAX_SIZE, ttlMs, keyFn } = options;
  const cache = new Map<string, CacheEntry<Awaited<ReturnType<T>>>>();
  const pending = new Map<string, Promise<Awaited<ReturnType<T>>>>();

  return ((...args: Parameters<Fn>) => {
    const key = keyFn ? keyFn(...args) : JSON.stringify(args);
    const now = Date.now();
    const existing = cache.get(key);

    if (existing) {
      if (ttlMs === undefined || now < existing.expiresAt) {
        return Promise.resolve(existing.value);
      }
      cache.delete(key);
    }

    const pendingPromise = pending.get(key);
    if (pendingPromise) return pendingPromise;

    const promise = fn(...args).then((result: Awaited<ReturnType<T>>) => {
      cache.set(key, { value: result, expiresAt: now + (ttlMs ?? Infinity) });
      pending.delete(key);
      if (cache.size > maxSize) {
        const firstKey = cache.keys().next().value;
        if (firstKey !== undefined) cache.delete(firstKey);
      }
      return result;
    }).catch((err: unknown) => {
      pending.delete(key);
      throw err;
    });

    pending.set(key, promise);
    return promise;
  }) as unknown as T;
}

export function deepMemoize<T extends Fn>(fn: T, options: MemoizeOptions = {}): T {
  return memoize(fn, {
    ...options,
    keyFn: (...args) => JSON.stringify(args),
  });
}
