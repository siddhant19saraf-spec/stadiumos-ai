// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Fn = (...args: any[]) => unknown;

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

  return ((...args: unknown[]) => {
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
    cache.set(key, { value: result as ReturnType<T>, expiresAt: now + (ttlMs ?? Infinity) });

    if (cache.size > maxSize) {
      const firstKey = cache.keys().next().value;
      if (firstKey !== undefined) cache.delete(firstKey);
    }

    return result;
  }) as T;
}

export async function memoizeAsync<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  options: MemoizeOptions = {},
): Promise<T> {
  const { maxSize = DEFAULT_MAX_SIZE, ttlMs, keyFn } = options;
  const cache = new Map<string, CacheEntry<Awaited<ReturnType<T>>>>();
  const pending = new Map<string, Promise<Awaited<ReturnType<T>>>>();

  return ((...args: unknown[]) => {
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

    const promise = fn(...args).then((result: unknown) => {
      cache.set(key, { value: result as Awaited<ReturnType<T>>, expiresAt: now + (ttlMs ?? Infinity) });
      pending.delete(key);
      if (cache.size > maxSize) {
        const firstKey = cache.keys().next().value;
        if (firstKey !== undefined) cache.delete(firstKey);
      }
      return result as Awaited<ReturnType<T>>;
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
