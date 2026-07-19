export interface IStorageCache<T> {
  get(key: string): T | null;
  set(key: string, value: T, ttlMs?: number): void;
  delete(key: string): boolean;
  clear(): void;
  size(): number;
}

interface StorageEntry<T> {
  value: T;
  expiresAt: number;
}

export class MemoryStorageCache<T> implements IStorageCache<T> {
  private store = new Map<string, StorageEntry<T>>();

  get(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  set(key: string, value: T, ttlMs = 300_000): void {
    this.store.set(key, { value, expiresAt: Date.now() + ttlMs });
  }

  delete(key: string): boolean { return this.store.delete(key); }
  clear(): void { this.store.clear(); }
  size(): number { return this.store.size; }
}

export class SessionStorageCache<T> implements IStorageCache<T> {
  private prefix: string;

  constructor(prefix = "cache_") { this.prefix = prefix; }

  get(key: string): T | null {
    try {
      const raw = sessionStorage.getItem(this.prefix + key);
      if (!raw) return null;
      const entry: StorageEntry<T> = JSON.parse(raw);
      if (Date.now() > entry.expiresAt) {
        sessionStorage.removeItem(this.prefix + key);
        return null;
      }
      return entry.value;
    } catch { return null; }
  }

  set(key: string, value: T, ttlMs = 300_000): void {
    try {
      sessionStorage.setItem(this.prefix + key, JSON.stringify({ value, expiresAt: Date.now() + ttlMs }));
    } catch { /* storage full */ }
  }

  delete(key: string): boolean {
    try { sessionStorage.removeItem(this.prefix + key); return true; }
    catch { return false; }
  }

  clear(): void {
    try {
      for (let i = sessionStorage.length - 1; i >= 0; i--) {
        const k = sessionStorage.key(i);
        if (k?.startsWith(this.prefix)) sessionStorage.removeItem(k);
      }
    } catch { /* ignore */ }
  }

  size(): number {
    try {
      let count = 0;
      for (let i = 0; i < sessionStorage.length; i++) {
        if (sessionStorage.key(i)?.startsWith(this.prefix)) count++;
      }
      return count;
    } catch { return 0; }
  }
}

export class LocalStorageCache<T> implements IStorageCache<T> {
  private prefix: string;

  constructor(prefix = "cache_") { this.prefix = prefix; }

  get(key: string): T | null {
    try {
      const raw = localStorage.getItem(this.prefix + key);
      if (!raw) return null;
      const entry: StorageEntry<T> = JSON.parse(raw);
      if (Date.now() > entry.expiresAt) {
        localStorage.removeItem(this.prefix + key);
        return null;
      }
      return entry.value;
    } catch { return null; }
  }

  set(key: string, value: T, ttlMs = 300_000): void {
    try {
      localStorage.setItem(this.prefix + key, JSON.stringify({ value, expiresAt: Date.now() + ttlMs }));
    } catch { /* storage full */ }
  }

  delete(key: string): boolean {
    try { localStorage.removeItem(this.prefix + key); return true; }
    catch { return false; }
  }

  clear(): void {
    try {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i);
        if (k?.startsWith(this.prefix)) localStorage.removeItem(k);
      }
    } catch { /* ignore */ }
  }

  size(): number {
    try {
      let count = 0;
      for (let i = 0; i < localStorage.length; i++) {
        if (localStorage.key(i)?.startsWith(this.prefix)) count++;
      }
      return count;
    } catch { return 0; }
  }
}
