import { describe, it, expect, beforeEach, vi } from "vitest";

/* ===================================================================
   Shared Performance Utilities
   =================================================================== */
describe("Performance Utilities", () => {
  describe("memoize", () => {
    it("should cache results and return cached value", async () => {
      const { memoize } = await import("@/lib/performance/memoize");
      let callCount = 0;
      const fn = memoize((n: number) => { callCount++; return n * 2; });

      expect(fn(5)).toBe(10);
      expect(callCount).toBe(1);
      expect(fn(5)).toBe(10);
      expect(callCount).toBe(1);
      expect(fn(10)).toBe(20);
      expect(callCount).toBe(2);
    });

    it("should respect maxSize", async () => {
      const { memoize } = await import("@/lib/performance/memoize");
      let callCount = 0;
      const fn = memoize((n: number) => { callCount++; return n; }, { maxSize: 2 });

      fn(1); fn(2); fn(3);
      expect(callCount).toBe(3);
      fn(1);
      expect(callCount).toBe(4);
    });

    it("should respect TTL", async () => {
      const { memoize } = await import("@/lib/performance/memoize");
      let callCount = 0;
      const fn = memoize((n: number) => { callCount++; return n; }, { ttlMs: -1 });

      fn(1);
      fn(1);
      expect(callCount).toBe(2);
    });
  });

  describe("memoizeAsync", () => {
    it("should cache async results", async () => {
      const { memoizeAsync } = await import("@/lib/performance/memoize");
      let callCount = 0;
      const fn = await memoizeAsync(async (n: number) => { callCount++; return n * 2; });

      expect(await fn(5)).toBe(10);
      expect(callCount).toBe(1);
      expect(await fn(5)).toBe(10);
      expect(callCount).toBe(1);
    });

    it("should deduplicate concurrent calls", async () => {
      const { memoizeAsync } = await import("@/lib/performance/memoize");
      let callCount = 0;
      const fn = await memoizeAsync(async (n: number) => {
        callCount++;
        await new Promise((r) => setTimeout(r, 10));
        return n;
      });

      const [a, b] = await Promise.all([fn(1), fn(1)]);
      expect(a).toBe(1);
      expect(b).toBe(1);
      expect(callCount).toBe(1);
    });
  });

  describe("debounce", () => {
    it("should delay execution", async () => {
      const { debounce } = await import("@/lib/performance/debounce");
      let callCount = 0;
      const fn = debounce(() => { callCount++; }, 50);

      fn(); fn(); fn();
      expect(callCount).toBe(0);
      await new Promise((r) => setTimeout(r, 100));
      expect(callCount).toBe(1);
    });

    it("should cancel pending execution", async () => {
      const { debounce } = await import("@/lib/performance/debounce");
      let callCount = 0;
      const fn = debounce(() => { callCount++; }, 50);

      fn();
      fn.cancel();
      await new Promise((r) => setTimeout(r, 100));
      expect(callCount).toBe(0);
    });

    it("should flush immediately", () => {
      const { debounce } = await import("@/lib/performance/debounce");
      let callCount = 0;
      const fn = debounce(() => { callCount++; }, 100);

      fn();
      fn.flush();
      expect(callCount).toBe(1);
    });
  });

  describe("throttle", () => {
    it("should limit execution rate", async () => {
      const { throttle } = await import("@/lib/performance/debounce");
      let callCount = 0;
      const fn = throttle(() => { callCount++; }, 50);

      fn(); fn(); fn();
      expect(callCount).toBe(1);
      await new Promise((r) => setTimeout(r, 100));
      expect(callCount).toBe(2);
    });
  });

  describe("CacheStore", () => {
    it("should store and retrieve values", async () => {
      const { CacheStore } = await import("@/lib/performance/cache");
      const store = new CacheStore<number>({ ttlMs: 5000 });

      store.set("key1", 100);
      expect(store.get("key1")?.value).toBe(100);
      expect(store.get("key2")).toBeNull();
    });

    it("should handle TTL expiration", async () => {
      const { CacheStore } = await import("@/lib/performance/cache");
      const store = new CacheStore<number>({ ttlMs: -1 });

      store.set("key", 100);
      expect(store.get("key")).toBeNull();
    });

    it("should support stale-while-revalidate", async () => {
      const { CacheStore } = await import("@/lib/performance/cache");
      const store = new CacheStore<number>({ ttlMs: -1, staleWhileRevalidate: true });

      store.set("key", 100);
      const result = store.get("key");
      expect(result).not.toBeNull();
      expect(result!.stale).toBe(true);
      expect(result!.value).toBe(100);
    });

    it("should get or fetch async", async () => {
      const { CacheStore } = await import("@/lib/performance/cache");
      const store = new CacheStore<number>({ ttlMs: 5000 });
      let callCount = 0;

      const result1 = await store.getOrFetch("key", async () => { callCount++; return 42; });
      expect(result1).toBe(42);
      expect(callCount).toBe(1);

      const result2 = await store.getOrFetch("key", async () => { callCount++; return 99; });
      expect(result2).toBe(42);
      expect(callCount).toBe(1);
    });

    it("should enforce max size with eviction", () => {
      const { CacheStore } = await import("@/lib/performance/cache");
      const store = new CacheStore<number>({ ttlMs: 5000, maxSize: 2 });

      store.set("a", 1);
      store.set("b", 2);
      store.set("c", 3);

      expect(store.size()).toBeLessThanOrEqual(2);
    });

    it("should track hit/miss stats", () => {
      const { CacheStore } = await import("@/lib/performance/cache");
      const store = new CacheStore<number>({ ttlMs: 5000 });

      store.get("miss1");
      store.get("miss2");
      store.set("hit1", 1);
      store.get("hit1");
      store.get("hit1");

      const stats = store.stats();
      expect(stats.hits).toBe(2);
      expect(stats.misses).toBe(2);
      expect(stats.hitRate).toBe(50);
    });
  });

  describe("async utilities", () => {
    it("should run tasks with limited concurrency", async () => {
      const { createAsyncQueue } = await import("@/lib/performance/async");
      const queue = createAsyncQueue(2);
      let concurrent = 0;
      let maxConcurrent = 0;

      const tasks = Array.from({ length: 5 }, (_, i) =>
        queue.add(async () => {
          concurrent++;
          maxConcurrent = Math.max(maxConcurrent, concurrent);
          await new Promise((r) => setTimeout(r, 20));
          concurrent--;
          return i;
        }),
      );

      const results = await Promise.all(tasks);
      expect(results).toEqual([0, 1, 2, 3, 4]);
      expect(maxConcurrent).toBeLessThanOrEqual(2);
    });

    it("should batch process items", async () => {
      const { createBatchProcessor } = await import("@/lib/performance/async");
      const processor = createBatchProcessor<number, number>(
        async (items) => items.map((n) => n * 2),
        { maxBatchSize: 3, maxWaitMs: 1000 },
      );

      const [a, b, c, d] = await Promise.all([
        processor.add(1), processor.add(2), processor.add(3), processor.add(4),
      ]);
      expect(a).toBe(2);
      expect(b).toBe(4);
      expect(c).toBe(6);
      expect(d).toBe(8);
    });

    it("should retry on failure", async () => {
      const { createRetryStrategy } = await import("@/lib/performance/async");
      let attempts = 0;
      const strategy = createRetryStrategy(async () => {
        attempts++;
        if (attempts < 3) throw new Error("Temporary failure");
        return "success";
      }, { maxRetries: 3, baseDelayMs: 10 });

      const result = await strategy.execute();
      expect(result).toBe("success");
      expect(attempts).toBe(3);
    });

    it("should throw after max retries", async () => {
      const { createRetryStrategy } = await import("@/lib/performance/async");
      const strategy = createRetryStrategy(async () => {
        throw new Error("Persistent failure");
      }, { maxRetries: 2, baseDelayMs: 10 });

      await expect(strategy.execute()).rejects.toThrow("Persistent failure");
    });

    it("should timeout long operations", async () => {
      const { timeout } = await import("@/lib/performance/async");
      await expect(
        timeout(new Promise((r) => setTimeout(r, 1000)), 50),
      ).rejects.toThrow("Operation timed out");
    });
  });

  describe("StorageCache", () => {
    it("should store and retrieve from memory", async () => {
      const { MemoryStorageCache } = await import("@/lib/performance/storage-cache");
      const cache = new MemoryStorageCache<number>();

      cache.set("key", 42, 5000);
      expect(cache.get("key")).toBe(42);
      expect(cache.get("nonexistent")).toBeNull();
    });

    it("should respect TTL in memory cache", async () => {
      const { MemoryStorageCache } = await import("@/lib/performance/storage-cache");
      const cache = new MemoryStorageCache<number>();

      cache.set("key", 42, -1);
      expect(cache.get("key")).toBeNull();
    });

    it("should delete and clear", async () => {
      const { MemoryStorageCache } = await import("@/lib/performance/storage-cache");
      const cache = new MemoryStorageCache<number>();

      cache.set("a", 1);
      cache.set("b", 2);
      expect(cache.size()).toBe(2);
      cache.delete("a");
      expect(cache.size()).toBe(1);
      cache.clear();
      expect(cache.size()).toBe(0);
    });
  });
});

/* ===================================================================
   Performance Monitor Engine
   =================================================================== */
describe("PerformanceMonitor Engine", () => {
  beforeEach(async () => {
    const { performanceMonitor: pm } = await import("@/services/performance-monitor");
    pm.reset();
  });

  it("should record and retrieve metrics", async () => {
    const { performanceMonitor: pm } = await import("@/services/performance-monitor");
    pm.recordMetric({ name: "test_metric", value: 100, unit: "ms", timestamp: new Date().toISOString(), tags: {} });

    const metrics = pm.getMetrics("test_metric");
    expect(metrics).toHaveLength(1);
    expect(metrics[0].value).toBe(100);
  });

  it("should record API latency", async () => {
    const { performanceMonitor: pm } = await import("@/services/performance-monitor");
    pm.recordApiLatency({ path: "/api/test", method: "GET", durationMs: 150, statusCode: 200, timestamp: new Date().toISOString(), correlationId: "corr-1" });

    const records = pm.getApiLatency("/api/test");
    expect(records).toHaveLength(1);
    expect(records[0].durationMs).toBe(150);
  });

  it("should compute performance summary", async () => {
    const { performanceMonitor: pm } = await import("@/services/performance-monitor");
    for (let i = 0; i < 10; i++) {
      pm.recordApiLatency({ path: "/api/test", method: "GET", durationMs: 100 + i * 10, statusCode: 200, timestamp: new Date().toISOString(), correlationId: `corr-${i}` });
    }

    const summary = pm.computeSummary();
    expect(summary.avgApiLatencyMs).toBeGreaterThan(0);
    expect(summary.totalRequests).toBe(10);
    expect(summary.p50LatencyMs).toBeGreaterThan(0);
    expect(summary.p95LatencyMs).toBeGreaterThan(0);
  });

  it("should detect slow endpoints", async () => {
    const { performanceMonitor: pm } = await import("@/services/performance-monitor");
    for (let i = 0; i < 5; i++) {
      pm.recordApiLatency({ path: "/api/slow", method: "GET", durationMs: 800 + i * 50, statusCode: 200, timestamp: new Date().toISOString(), correlationId: `corr-${i}` });
      pm.recordApiLatency({ path: "/api/fast", method: "GET", durationMs: 50, statusCode: 200, timestamp: new Date().toISOString(), correlationId: `corr-f-${i}` });
    }

    const slow = pm.getSlowEndpoints(3);
    expect(slow.length).toBeGreaterThan(0);
    expect(slow[0].path).toBe("/api/slow");
  });

  it("should compute health check", async () => {
    const { performanceMonitor: pm } = await import("@/services/performance-monitor");
    const health = pm.getHealthCheck();

    expect(health).toHaveProperty("status");
    expect(health).toHaveProperty("uptimeSeconds");
    expect(health).toHaveProperty("checks");
    expect(["healthy", "degraded", "unhealthy"]).toContain(health.status);
  });

  it("should report error rate accurately", async () => {
    const { performanceMonitor: pm } = await import("@/services/performance-monitor");
    for (let i = 0; i < 8; i++) {
      pm.recordApiLatency({ path: "/api/test", method: "GET", durationMs: 100, statusCode: 200, timestamp: new Date().toISOString(), correlationId: `corr-${i}` });
    }
    for (let i = 0; i < 2; i++) {
      pm.recordApiLatency({ path: "/api/test", method: "GET", durationMs: 100, statusCode: 500, timestamp: new Date().toISOString(), correlationId: `corr-e${i}` });
    }

    const summary = pm.computeSummary();
    expect(summary.errorRate).toBe(20);
  });

  it("should reset all data", async () => {
    const { performanceMonitor: pm } = await import("@/services/performance-monitor");
    pm.recordMetric({ name: "test", value: 1, unit: "ms", timestamp: "", tags: {} });
    pm.reset();
    expect(pm.getMetrics().length).toBe(0);
    expect(pm.getApiLatency().length).toBe(0);
  });
});

/* ===================================================================
   Performance Middleware
   =================================================================== */
describe("Performance Middleware", () => {
  it("should record API calls", async () => {
    const { performanceMiddleware } = await import("@/middleware/performance-middleware");
    const { performanceMonitor: pm } = await import("@/services/performance-monitor");
    pm.reset();

    performanceMiddleware.recordApiCall("/api/test", "POST", 200, 200, "corr-1");
    expect(pm.getApiLatency("/api/test")).toHaveLength(1);
  });

  it("should record page loads", async () => {
    const { performanceMiddleware } = await import("@/middleware/performance-middleware");
    const { performanceMonitor: pm } = await import("@/services/performance-monitor");
    pm.reset();

    performanceMiddleware.recordPageLoad("/dashboard", 1500);
    const metrics = pm.getMetrics("page_load");
    expect(metrics).toHaveLength(1);
    expect(metrics[0].value).toBe(1500);
  });

  it("should record AI responses", async () => {
    const { performanceMiddleware } = await import("@/middleware/performance-middleware");
    const { performanceMonitor: pm } = await import("@/services/performance-monitor");
    pm.reset();

    performanceMiddleware.recordAiResponse("copilot", 2000);
    const metrics = pm.getMetrics("ai_response");
    expect(metrics).toHaveLength(1);
    expect(metrics[0].value).toBe(2000);
  });

  it("should record web vitals", async () => {
    const { performanceMiddleware } = await import("@/middleware/performance-middleware");
    const { performanceMonitor: pm } = await import("@/services/performance-monitor");
    pm.reset();

    performanceMiddleware.recordWebVital("lcp", 1800);
    performanceMiddleware.recordWebVital("cls", 0.05);
    expect(pm.getMetrics("lcp")).toHaveLength(1);
    expect(pm.getMetrics("cls")).toHaveLength(1);
  });

  it("should create response timing header", () => {
    const { performanceMiddleware } = await import("@/middleware/performance-middleware");
    const header = performanceMiddleware.getRequestTimingHeader(Date.now() - 100);
    expect(header["X-Response-Time-Ms"]).toBeTruthy();
  });

  it("should create a timer", async () => {
    const { performanceMiddleware } = await import("@/middleware/performance-middleware");
    const timer = performanceMiddleware.createTimer();
    const start = timer.start();
    await new Promise((r) => setTimeout(r, 20));
    const elapsed = timer.elapsed();
    expect(elapsed).toBeGreaterThanOrEqual(15);
  });
});

/* ===================================================================
   Performance Benchmark Tests
   =================================================================== */
describe("Performance Benchmarks", () => {
  it("should memoize faster than raw computation for repeated calls", async () => {
    const { memoize } = await import("@/lib/performance/memoize");

    function expensiveComputation(n: number): number {
      let result = 0;
      for (let i = 0; i < 10000; i++) result += n * i;
      return result;
    }

    const memoized = memoize(expensiveComputation);

    // Warm up
    memoized(42);

    const rawStart = performance.now();
    for (let i = 0; i < 100; i++) expensiveComputation(42);
    const rawDuration = performance.now() - rawStart;

    const memoStart = performance.now();
    for (let i = 0; i < 100; i++) memoized(42);
    const memoDuration = performance.now() - memoStart;

    expect(memoDuration).toBeLessThan(rawDuration);
  });

  it("should batch process faster than individual calls", async () => {
    const { createBatchProcessor } = await import("@/lib/performance/async");

    async function simulateBatch(items: number[]): Promise<number[]> {
      await new Promise((r) => setTimeout(r, 10));
      return items.map((n) => n * 2);
    }

    const processor = createBatchProcessor<number, number>(simulateBatch, {
      maxBatchSize: 50, maxWaitMs: 100,
    });

    const batchStart = performance.now();
    const batchResults = await Promise.all(Array.from({ length: 20 }, (_, i) => processor.add(i)));
    const batchDuration = performance.now() - batchStart;

    const individualStart = performance.now();
    const individualResults = await Promise.all(
      Array.from({ length: 20 }, (_, i) => simulateBatch([i]).then((r) => r[0])),
    );
    const individualDuration = performance.now() - individualStart;

    expect(batchResults).toEqual(individualResults);
    expect(batchDuration).toBeLessThan(individualDuration);
  });

  it("should cache repeated async operations", async () => {
    const { withCache, cacheClear } = await import("@/lib/performance/cache");
    cacheClear();

    let callCount = 0;
    async function fetchData(id: number): Promise<{ id: number; data: string }> {
      callCount++;
      await new Promise((r) => setTimeout(r, 10));
      return { id, data: `result-${id}` };
    }

    await withCache("bench-1", () => fetchData(1));
    await withCache("bench-1", () => fetchData(1));
    await withCache("bench-1", () => fetchData(1));

    expect(callCount).toBe(1);
  });

  it("should limit concurrent async operations", async () => {
    const { createAsyncQueue } = await import("@/lib/performance/async");
    const queue = createAsyncQueue(1);
    let maxConcurrent = 0;
    let current = 0;

    const tasks = Array.from({ length: 5 }, () =>
      queue.add(async () => {
        current++;
        maxConcurrent = Math.max(maxConcurrent, current);
        await new Promise((r) => setTimeout(r, 10));
        current--;
      }),
    );

    await Promise.all(tasks);
    expect(maxConcurrent).toBe(1);
  });

  it("should debounce rapid calls into a single execution", async () => {
    const { debounce } = await import("@/lib/performance/debounce");
    let callCount = 0;

    const fn = debounce(() => { callCount++; }, 50);
    for (let i = 0; i < 100; i++) fn();
    await new Promise((r) => setTimeout(r, 100));

    expect(callCount).toBe(1);
  });

  it("should throttle calls to at most once per interval", async () => {
    const { throttle } = await import("@/lib/performance/debounce");
    let callCount = 0;

    const fn = throttle(() => { callCount++; }, 30);
    for (let i = 0; i < 10; i++) {
      fn();
      await new Promise((r) => setTimeout(r, 5));
    }
    await new Promise((r) => setTimeout(r, 50));

    expect(callCount).toBeGreaterThanOrEqual(1);
    expect(callCount).toBeLessThanOrEqual(4);
  });

  it("should measure sync function duration", async () => {
    const { measureSync } = await import("@/lib/performance/measure");

    const { result, durationMs } = measureSync("bench-sync", () => {
      let sum = 0;
      for (let i = 0; i < 100000; i++) sum += i;
      return sum;
    });

    expect(result).toBeGreaterThan(0);
    expect(durationMs).toBeGreaterThan(0);
  });

  it("should measure async function duration", async () => {
    const { measureAsync } = await import("@/lib/performance/measure");

    const { result, durationMs } = await measureAsync("bench-async", async () => {
      await new Promise((r) => setTimeout(r, 20));
      return "done";
    });

    expect(result).toBe("done");
    expect(durationMs).toBeGreaterThanOrEqual(15);
  });
});

