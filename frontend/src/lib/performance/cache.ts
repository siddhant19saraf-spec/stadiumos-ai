// @ts-nocheck
interface CacheConfig {
  ttlMs: number;
  maxSize: number;
  staleWhileRevalidate?: boolean;
}

interface CacheItem<T> {
  value: T;
  expiresAt: number;
  createdAt: number;
  hitCount: number;
  staleAt: number;
}

const DEFAULT_CONFIG: CacheConfig = {
  ttlMs: 60_000,
  maxSize: 1000,
  staleWhileRevalidate: false,
};

class CacheStoreManager {
  private stores = new Map<string, CacheStore<any>>();

  getOrCreate<T>(name: string, config?: Partial<CacheConfig>): CacheStore<T> {
    if (this.stores.has(name)) return this.stores.get(name)!;
    const store = new CacheStore<T>(config);
    this.stores.set(name, store);
    return store;
  }

  clearAll(): void {
    for (const store of this.stores.values()) store.clear();
  }

  getAllStats(): Record<string, { size: number; hits: number; misses: number }> {
    const stats: Record<string, { size: number; hits: number; misses: number }> = {};
    for (const [name, store] of this.stores) stats[name] = store.stats();
    return stats;
  }
}

export const cacheStoreManager = new CacheStoreManager();

export class CacheStore<T> {
  private cache = new Map<string, CacheItem<T>>();
  private config: CacheConfig;
  private hits = 0;
  private misses = 0;
  private pendingRefreshes = new Map<string, Promise<T>>();

  constructor(config?: Partial<CacheConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  get(key: string): { value: T; stale: boolean } | null {
    const item = this.cache.get(key);
    if (!item) { this.misses++; return null; }

    const now = Date.now();
    if (now < item.expiresAt) {
      this.hits++;
      item.hitCount++;
      return { value: item.value, stale: false };
    }

    if (this.config.staleWhileRevalidate && now < item.staleAt) {
      this.hits++;
      item.hitCount++;
      return { value: item.value, stale: true };
    }

    this.cache.delete(key);
    this.misses++;
    return null;
  }

  set(key: string, value: T): void {
    const now = Date.now();
    this.cache.set(key, {
      value,
      expiresAt: now + this.config.ttlMs,
      createdAt: now,
      hitCount: 0,
      staleAt: now + this.config.ttlMs * 2,
    });
    this.evict();
  }

  async getOrFetch(key: string, fetcher: () => Promise<T>): Promise<T> {
    const existing = this.get(key);
    if (existing && !existing.stale) return existing.value;

    if (this.config.staleWhileRevalidate && existing?.stale) {
      this.refreshAsync(key, fetcher);
      return existing.value;
    }

    const pending = this.pendingRefreshes.get(key);
    if (pending) return pending;

    const promise = fetcher().then((value) => {
      this.set(key, value);
      this.pendingRefreshes.delete(key);
      return value;
    }).catch((err) => {
      this.pendingRefreshes.delete(key);
      throw err;
    });

    this.pendingRefreshes.set(key, promise);
    return promise;
  }

  private async refreshAsync(key: string, fetcher: () => Promise<T>): Promise<void> {
    const pending = this.pendingRefreshes.get(key);
    if (pending) return;
    const promise = fetcher().then((value) => {
      this.set(key, value);
      this.pendingRefreshes.delete(key);
    }).catch(() => {
      this.pendingRefreshes.delete(key);
    });
    this.pendingRefreshes.set(key, promise);
  }

  has(key: string): boolean {
    return this.cache.has(key) && Date.now() < this.cache.get(key)!.expiresAt;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  size(): number {
    return this.cache.size;
  }

  stats(): { size: number; hits: number; misses: number; hitRate: number } {
    const total = this.hits + this.misses;
    return {
      size: this.cache.size,
      hits: this.hits,
      misses: this.misses,
      hitRate: total > 0 ? Math.round((this.hits / total) * 100) : 0,
    };
  }

  private evict(): void {
    if (this.cache.size <= this.config.maxSize) return;
    const entries = Array.from(this.cache.entries())
      .map(([key, item]) => ({ key, hitCount: item.hitCount, createdAt: item.createdAt }))
      .sort((a, b) => a.hitCount - b.hitCount || a.createdAt - b.createdAt);

    const toRemove = this.cache.size - this.config.maxSize;
    for (let i = 0; i < toRemove && i < entries.length; i++) {
      this.cache.delete(entries[i].key);
    }
  }
}

const defaultStore = new CacheStore();

export function cacheGet<T>(key: string): T | null {
  const result = defaultStore.get(key);
  return result ? result.value : null;
}

export function cacheSet<T>(key: string, value: T): void {
  defaultStore.set(key, value);
}

export function cacheDelete(key: string): boolean {
  return defaultStore.delete(key);
}

export function cacheClear(): void {
  defaultStore.clear();
}

export function cacheStats(): ReturnType<CacheStore<unknown>["stats"]> {
  return defaultStore.stats();
}

export async function withCache<T>(key: string, fetcher: () => Promise<T>, ttlMs?: number): Promise<T> {
  const store = ttlMs ? new CacheStore<T>({ ttlMs }) : defaultStore;
  return store.getOrFetch(key, fetcher);
}

