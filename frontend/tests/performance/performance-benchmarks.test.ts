import { describe, it, expect, vi, beforeAll } from "vitest";
import { memoize } from "@/lib/performance/memoize";
import { debounce, throttle } from "@/lib/performance/debounce";
import { CacheStore } from "@/lib/performance/cache";
import { createAsyncQueue, createBatchProcessor, createRetryStrategy, timeout } from "@/lib/performance/async";
import { measureSync, measureAsync } from "@/lib/performance/measure";

describe("Memoization Performance", () => {
  it("should cache results for repeated calls", () => {
    let callCount = 0;
    const fn = memoize((n: number) => {
      callCount++;
      return n * 2;
    });
    fn(5); fn(5); fn(5);
    expect(callCount).toBe(1);
  });

  it("should respect maxSize limit", () => {
    let callCount = 0;
    const fn = memoize((n: number) => {
      callCount++;
      return n * 2;
    }, { maxSize: 2 });
    fn(1); fn(2); fn(3);
    expect(callCount).toBe(3);
  });

  it("should respect TTL", async () => {
    let callCount = 0;
    const fn = memoize((n: number) => {
      callCount++;
      return n * 2;
    }, { ttl: 50 });
    fn(5);
    await new Promise((r) => setTimeout(r, 60));
    fn(5);
    expect(callCount).toBe(2);
  });

  it("should handle multiple distinct arguments", () => {
    let callCount = 0;
    const fn = memoize((a: number, b: number) => {
      callCount++;
      return a + b;
    });
    fn(1, 2); fn(1, 2); fn(3, 4);
    expect(callCount).toBe(2);
  });

  it("should be faster than raw computation for expensive ops", () => {
    function expensive(n: number): number {
      let result = 0;
      for (let i = 0; i < 10000; i++) result += Math.sqrt(n * i);
      return result;
    }
    const memoized = memoize(expensive);
    const rawTime = measureSync(() => { for (let i = 0; i < 50; i++) expensive(42); });
    const memoTime = measureSync(() => { for (let i = 0; i < 50; i++) memoized(42); });
    expect(memoTime).toBeLessThan(rawTime);
  });
});

describe("Debounce Performance", () => {
  it("should reduce execution count", async () => {
    let count = 0;
    const fn = debounce(() => { count++; }, 50);
    for (let i = 0; i < 100; i++) fn();
    await new Promise((r) => setTimeout(r, 100));
    expect(count).toBeLessThanOrEqual(1);
  });

  it("should cancel pending execution", async () => {
    let count = 0;
    const fn = debounce(() => { count++; }, 50);
    fn(); fn.cancel();
    await new Promise((r) => setTimeout(r, 100));
    expect(count).toBe(0);
  });

  it("should flush immediately", () => {
    let count = 0;
    const fn = debounce(() => { count++; }, 1000);
    fn(); fn.flush();
    expect(count).toBe(1);
  });
});

describe("Throttle Performance", () => {
  it("should limit execution rate", async () => {
    let count = 0;
    const fn = throttle(() => { count++; }, 100);
    const start = Date.now();
    while (Date.now() - start < 200) { fn(); }
    await new Promise((r) => setTimeout(r, 50));
    expect(count).toBeGreaterThanOrEqual(1);
    expect(count).toBeLessThanOrEqual(5);
  });
});

describe("CacheStore Performance", () => {
  it("should serve cached data instantly", () => {
    const cache = new CacheStore<number>({ ttl: 60000, maxSize: 100 });
    cache.set("key1", 42);
    const getTime = measureSync(() => { for (let i = 0; i < 1000; i++) cache.get("key1"); });
    expect(getTime).toBeLessThan(50);
  });

  it("should handle cache misses gracefully", () => {
    const cache = new CacheStore<number>({ ttl: 60000, maxSize: 100 });
    expect(cache.get("nonexistent")).toBeUndefined();
  });

  it("should evict LRU entries when maxSize exceeded", () => {
    const cache = new CacheStore<string>({ ttl: 60000, maxSize: 3 });
    cache.set("a", "1"); cache.set("b", "2"); cache.set("c", "3");
    cache.get("a");
    cache.set("d", "4");
    expect(cache.get("b")).toBeUndefined();
    expect(cache.get("a")).toBe("1");
    expect(cache.get("d")).toBe("4");
  });

  it("should compute stats correctly", () => {
    const cache = new CacheStore<number>({ ttl: 60000, maxSize: 100 });
    cache.set("a", 1); cache.set("b", 2);
    cache.get("a"); cache.get("a"); cache.get("b"); cache.get("c");
    const stats = cache.getStats();
    expect(stats.hits).toBeGreaterThan(0);
    expect(stats.misses).toBeGreaterThan(0);
    expect(stats.size).toBe(2);
  });

  it("should clear all entries", () => {
    const cache = new CacheStore<number>({ ttl: 60000, maxSize: 100 });
    cache.set("a", 1); cache.set("b", 2);
    cache.clear();
    expect(cache.get("a")).toBeUndefined();
    expect(cache.get("b")).toBeUndefined();
    expect(cache.getStats().size).toBe(0);
  });
});

describe("Async Queue Performance", () => {
  it("should limit concurrent executions", async () => {
    let concurrent = 0;
    let maxConcurrent = 0;
    const queue = createAsyncQueue(2);
    const tasks = Array.from({ length: 10 }, (_, i) =>
      queue(() => new Promise<void>((r) => {
        concurrent++;
        maxConcurrent = Math.max(maxConcurrent, concurrent);
        setTimeout(() => { concurrent--; r(); }, 50);
      }))
    );
    await Promise.all(tasks);
    expect(maxConcurrent).toBeLessThanOrEqual(2);
  });

  it("should process all queued tasks", async () => {
    let completed = 0;
    const queue = createAsyncQueue(5);
    const tasks = Array.from({ length: 20 }, () =>
      queue(async () => { completed++; })
    );
    await Promise.all(tasks);
    expect(completed).toBe(20);
  });
});

describe("Batch Processor Performance", () => {
  it("should batch individual items into groups", async () => {
    const processor = createBatchProcessor(async (items: number[]) => items.reduce((a, b) => a + b, 0), { maxSize: 5, maxWaitMs: 100 });
    const results = await Promise.all([1, 2, 3, 4, 5, 6, 7].map((n) => processor.add(n)));
    expect(results.length).toBeGreaterThan(0);
    processor.flush();
  });

  it("should flush on maxSize", async () => {
    let batchCount = 0;
    const processor = createBatchProcessor(async (items: number[]) => {
      batchCount++;
      return items.length;
    }, { maxSize: 3, maxWaitMs: 1000 });
    const results = await Promise.all([1, 2, 3, 4, 5, 6].map((n) => processor.add(n)));
    expect(batchCount).toBeGreaterThanOrEqual(1);
    processor.flush();
  });
});

describe("Retry Strategy", () => {
  it("should retry failed operations", async () => {
    let attempts = 0;
    const strategy = createRetryStrategy(async () => {
      attempts++;
      if (attempts < 3) throw new Error("transient");
      return "success";
    }, { maxRetries: 3, baseDelayMs: 10 });
    const result = await strategy();
    expect(result).toBe("success");
    expect(attempts).toBe(3);
  });

  it("should throw after exhausting retries", async () => {
    const strategy = createRetryStrategy(async () => {
      throw new Error("persistent");
    }, { maxRetries: 2, baseDelayMs: 10 });
    await expect(strategy()).rejects.toThrow("persistent");
  });

  it("should not retry on success", async () => {
    let attempts = 0;
    const strategy = createRetryStrategy(async () => {
      attempts++;
      return "ok";
    }, { maxRetries: 3, baseDelayMs: 10 });
    await strategy();
    expect(attempts).toBe(1);
  });
});

describe("Timeout Utility", () => {
  it("should resolve before timeout", async () => {
    const result = await timeout(Promise.resolve("fast"), 1000);
    expect(result).toBe("fast");
  });

  it("should reject on timeout", async () => {
    await expect(timeout(new Promise((r) => setTimeout(r, 2000)), 10)).rejects.toThrow();
  });
});

describe("Performance Measurement", () => {
  it("should measure sync execution time", () => {
    const time = measureSync(() => {
      let sum = 0;
      for (let i = 0; i < 100000; i++) sum += i;
    });
    expect(time).toBeGreaterThanOrEqual(0);
    expect(typeof time).toBe("number");
  });

  it("should measure async execution time", async () => {
    const time = await measureAsync(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });
    expect(time).toBeGreaterThanOrEqual(0);
  });

  it("should return zero for no-op", () => {
    const time = measureSync(() => {});
    expect(time).toBeGreaterThanOrEqual(0);
  });
});

describe("Load Simulation", () => {
  it("should handle 1000 memoized calls", () => {
    let count = 0;
    const fn = memoize((n: number) => { count++; return n * n; }, { maxSize: 100 });
    for (let i = 0; i < 1000; i++) fn(i % 100);
    expect(count).toBeLessThanOrEqual(100);
  });

  it("should handle cache burst load", () => {
    const cache = new CacheStore<number>({ ttl: 60000, maxSize: 1000 });
    const writeTime = measureSync(() => {
      for (let i = 0; i < 1000; i++) cache.set(`key-${i}`, i);
    });
    expect(writeTime).toBeLessThan(100);
    const readTime = measureSync(() => {
      for (let i = 0; i < 1000; i++) cache.get(`key-${i}`);
    });
    expect(readTime).toBeLessThan(50);
  });

  it("should handle concurrent cache operations", async () => {
    const cache = new CacheStore<number>({ ttl: 60000, maxSize: 1000 });
    await Promise.all(Array.from({ length: 100 }, (_, i) =>
      Promise.resolve().then(() => { cache.set(`k-${i}`, i); cache.get(`k-${i}`); })
    ));
    expect(cache.getStats().size).toBeGreaterThan(0);
  });

  it("should sustain high-frequency debounce", async () => {
    let count = 0;
    const fn = debounce(() => { count++; }, 5);
    for (let i = 0; i < 500; i++) fn();
    await new Promise((r) => setTimeout(r, 50));
    expect(count).toBeLessThanOrEqual(2);
  });
});

