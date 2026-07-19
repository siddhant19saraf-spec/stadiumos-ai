import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { performanceMonitor, MockPerformanceMonitorEngine } from "@/services/performance-monitor";
import { performanceMiddleware } from "@/middleware/performance-middleware";
import { memoize, memoizeAsync, deepMemoize } from "@/lib/performance/memoize";
import { debounce, throttle, rafThrottle, leadingDebounce } from "@/lib/performance/debounce";
import { CacheStore, cacheGet, cacheSet, cacheDelete, cacheClear, cacheStats, withCache, cacheStoreManager } from "@/lib/performance/cache";
import { createAsyncQueue, createBatchProcessor, createRetryStrategy, timeout } from "@/lib/performance/async";
import { createPerformanceTimer, measureSync, measureAsync, getPerformanceMarks, clearPerformanceMarks } from "@/lib/performance/measure";
import { MemoryStorageCache, SessionStorageCache, LocalStorageCache } from "@/lib/performance/storage-cache";
import type { PerformanceMetric, ApiLatencyRecord, PerformanceSummary, HealthStatus } from "@/services/performance-monitor";

describe("PerformanceMonitorEngine", () => {
  beforeEach(() => {
    performanceMonitor.reset();
  });

  it("should record metrics and retrieve them", () => {
    performanceMonitor.recordMetric({ name: "page_load", value: 1200, unit: "ms", timestamp: new Date().toISOString(), tags: { route: "/test" } });
    const metrics = performanceMonitor.getMetrics("page_load");
    expect(metrics).toHaveLength(1);
    expect(metrics[0].value).toBe(1200);
  });

  it("getMetrics without name returns all metrics", () => {
    performanceMonitor.recordMetric({ name: "a", value: 1, unit: "ms", timestamp: "", tags: {} });
    performanceMonitor.recordMetric({ name: "b", value: 2, unit: "ms", timestamp: "", tags: {} });
    expect(performanceMonitor.getMetrics()).toHaveLength(2);
  });

  it("getMetrics with name filters correctly", () => {
    performanceMonitor.recordMetric({ name: "page_load", value: 100, unit: "ms", timestamp: "", tags: {} });
    performanceMonitor.recordMetric({ name: "ai_response", value: 200, unit: "ms", timestamp: "", tags: {} });
    const pageLoads = performanceMonitor.getMetrics("page_load");
    expect(pageLoads).toHaveLength(1);
    expect(pageLoads[0].name).toBe("page_load");
  });

  it("recordApiLatency should store API records", () => {
    performanceMonitor.recordApiLatency({ path: "/api/test", method: "GET", durationMs: 150, statusCode: 200, timestamp: "", correlationId: "corr-1" });
    const records = performanceMonitor.getApiLatency();
    expect(records).toHaveLength(1);
  });

  it("getApiLatency with path should filter", () => {
    performanceMonitor.recordApiLatency({ path: "/api/a", method: "GET", durationMs: 100, statusCode: 200, timestamp: "", correlationId: "c1" });
    performanceMonitor.recordApiLatency({ path: "/api/b", method: "POST", durationMs: 200, statusCode: 201, timestamp: "", correlationId: "c2" });
    const aRecords = performanceMonitor.getApiLatency("/api/a");
    expect(aRecords).toHaveLength(1);
    expect(aRecords[0].path).toBe("/api/a");
  });

  it("computeSummary should return PerformanceSummary structure", () => {
    const summary = performanceMonitor.computeSummary();
    expect(summary).toHaveProperty("avgPageLoadMs");
    expect(summary).toHaveProperty("avgApiLatencyMs");
    expect(summary).toHaveProperty("totalRequests");
    expect(summary).toHaveProperty("errorRate");
    expect(summary).toHaveProperty("p50LatencyMs");
    expect(summary).toHaveProperty("p95LatencyMs");
    expect(summary).toHaveProperty("p99LatencyMs");
    expect(summary).toHaveProperty("cacheHitRate");
    expect(summary).toHaveProperty("slowEndpoints");
  });

  it("computeSummary p50/p95/p99 should be valid", () => {
    for (let i = 0; i < 10; i++) {
      performanceMonitor.recordApiLatency({ path: "/api/test", method: "GET", durationMs: 100 + i * 50, statusCode: 200, timestamp: "", correlationId: `c${i}` });
    }
    const summary = performanceMonitor.computeSummary();
    expect(summary.p50LatencyMs).toBeGreaterThanOrEqual(0);
    expect(summary.p95LatencyMs).toBeGreaterThanOrEqual(summary.p50LatencyMs);
    expect(summary.p99LatencyMs).toBeGreaterThanOrEqual(summary.p95LatencyMs);
  });

  it("computeSummary errorRate should reflect 4xx/5xx", () => {
    performanceMonitor.recordApiLatency({ path: "/api/error", method: "GET", durationMs: 100, statusCode: 500, timestamp: "", correlationId: "e1" });
    performanceMonitor.recordApiLatency({ path: "/api/ok", method: "GET", durationMs: 50, statusCode: 200, timestamp: "", correlationId: "o1" });
    const summary = performanceMonitor.computeSummary();
    expect(summary.errorRate).toBe(50);
  });

  it("getHealthCheck should return HealthStatus", () => {
    const health = performanceMonitor.getHealthCheck();
    expect(health).toHaveProperty("status");
    expect(health).toHaveProperty("uptimeSeconds");
    expect(health).toHaveProperty("lastCheck");
    expect(health).toHaveProperty("checks");
    expect(["healthy", "degraded", "unhealthy"]).toContain(health.status);
  });

  it("getHealthCheck should have api check", () => {
    const health = performanceMonitor.getHealthCheck();
    expect(health.checks).toHaveProperty("api");
    expect(health.checks.api).toHaveProperty("status");
    expect(health.checks.api).toHaveProperty("latencyMs");
  });

  it("getHealthCheck should have memory check", () => {
    const health = performanceMonitor.getHealthCheck();
    expect(health.checks).toHaveProperty("memory");
    expect(health.checks.memory).toHaveProperty("status");
  });

  it("getHealthCheck should have errors check", () => {
    const health = performanceMonitor.getHealthCheck();
    expect(health.checks).toHaveProperty("errors");
    expect(health.checks.errors).toHaveProperty("status");
  });

  it("getCacheStats should return stats object", () => {
    const stats = performanceMonitor.getCacheStats();
    expect(stats).toBeDefined();
    expect(typeof stats).toBe("object");
  });

  it("getSlowEndpoints should return sorted by avgMs descending", () => {
    performanceMonitor.recordApiLatency({ path: "/api/slow", method: "GET", durationMs: 900, statusCode: 200, timestamp: "", correlationId: "s1" });
    performanceMonitor.recordApiLatency({ path: "/api/slow", method: "GET", durationMs: 800, statusCode: 200, timestamp: "", correlationId: "s2" });
    performanceMonitor.recordApiLatency({ path: "/api/slow", method: "GET", durationMs: 1000, statusCode: 200, timestamp: "", correlationId: "s3" });
    performanceMonitor.recordApiLatency({ path: "/api/fast", method: "GET", durationMs: 50, statusCode: 200, timestamp: "", correlationId: "f1" });
    performanceMonitor.recordApiLatency({ path: "/api/fast", method: "GET", durationMs: 60, statusCode: 200, timestamp: "", correlationId: "f2" });
    performanceMonitor.recordApiLatency({ path: "/api/fast", method: "GET", durationMs: 70, statusCode: 200, timestamp: "", correlationId: "f3" });
    const slow = performanceMonitor.getSlowEndpoints(3);
    expect(slow.length).toBeGreaterThan(0);
    if (slow.length >= 2) {
      expect(slow[0].avgMs).toBeGreaterThanOrEqual(slow[1].avgMs);
    }
  });

  it("getSlowEndpoints should only include endpoints meeting minRequests", () => {
    performanceMonitor.recordApiLatency({ path: "/api/rare", method: "GET", durationMs: 999, statusCode: 200, timestamp: "", correlationId: "r1" });
    const slow = performanceMonitor.getSlowEndpoints(3);
    expect(slow.every((s) => s.count >= 3)).toBe(true);
  });

  it("reset should clear all data", () => {
    performanceMonitor.recordMetric({ name: "page_load", value: 100, unit: "ms", timestamp: "", tags: {} });
    performanceMonitor.recordApiLatency({ path: "/api/test", method: "GET", durationMs: 100, statusCode: 200, timestamp: "", correlationId: "c" });
    performanceMonitor.reset();
    expect(performanceMonitor.getMetrics()).toHaveLength(0);
    expect(performanceMonitor.getApiLatency()).toHaveLength(0);
  });

  it("seedMockData should populate metrics and API records", () => {
    performanceMonitor.reset();
    performanceMonitor.seedMockData();
    const metrics = performanceMonitor.getMetrics();
    const apiRecords = performanceMonitor.getApiLatency();
    expect(metrics.length).toBeGreaterThanOrEqual(10);
    expect(apiRecords.length).toBe(100);
  });
});

describe("PerformanceMiddleware", () => {
  it("recordApiCall should delegate to monitor", () => {
    performanceMiddleware.recordApiCall("/api/test", "GET", 150, 200, "corr-1");
    const records = performanceMonitor.getApiLatency("/api/test");
    expect(records.some((r) => r.correlationId === "corr-1")).toBe(true);
  });

  it("recordPageLoad should record metric with name page_load", () => {
    performanceMiddleware.recordPageLoad("/dashboard", 800);
    const metrics = performanceMonitor.getMetrics("page_load");
    expect(metrics.some((m) => m.tags.route === "/dashboard")).toBe(true);
  });

  it("recordAiResponse should record ai_response metric", () => {
    performanceMiddleware.recordAiResponse("copilot", 1500);
    const metrics = performanceMonitor.getMetrics("ai_response");
    expect(metrics.some((m) => m.tags.engine === "copilot")).toBe(true);
  });

  it("recordWebVital should record web vital metric", () => {
    performanceMiddleware.recordWebVital("lcp", 1800);
    const metrics = performanceMonitor.getMetrics("lcp");
    expect(metrics).toHaveLength(1);
    expect(metrics[0].unit).toBe("ms");
  });

  it("recordWebVital should use score unit for cls", () => {
    performanceMiddleware.recordWebVital("cls", 0.1);
    const metrics = performanceMonitor.getMetrics("cls");
    expect(metrics[0].unit).toBe("score");
  });

  it("getRequestTimingHeader should return timing header", () => {
    const start = Date.now() - 100;
    const headers = performanceMiddleware.getRequestTimingHeader(start);
    expect(headers).toHaveProperty("X-Response-Time-Ms");
    expect(Number(headers["X-Response-Time-Ms"])).toBeGreaterThanOrEqual(90);
  });

  it("createTimer should return timer with start and elapsed", () => {
    const timer = performanceMiddleware.createTimer();
    expect(timer).toHaveProperty("start");
    expect(timer).toHaveProperty("elapsed");
    expect(typeof timer.start()).toBe("number");
    expect(typeof timer.elapsed()).toBe("number");
  });
});

describe("Memoize", () => {
  it("memoize should cache function results", () => {
    const fn = vi.fn((x: number) => x * 2);
    const memoized = memoize(fn);
    expect(memoized(5)).toBe(10);
    expect(memoized(5)).toBe(10);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("memoize should differentiate arguments", () => {
    const fn = vi.fn((x: number) => x * 2);
    const memoized = memoize(fn);
    memoized(1);
    memoized(2);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("memoize with ttlMs should expire after timeout", () => {
    vi.useFakeTimers();
    const fn = vi.fn((x: number) => x * 2);
    const memoized = memoize(fn, { ttlMs: 100 });
    memoized(5);
    expect(fn).toHaveBeenCalledTimes(1);
    memoized(5);
    expect(fn).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(101);
    memoized(5);
    expect(fn).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });

  it("memoize with maxSize should evict oldest", () => {
    const fn = vi.fn((x: number) => x);
    const memoized = memoize(fn, { maxSize: 2 });
    memoized(1);
    memoized(2);
    memoized(3);
    // 1 should be evicted
    memoized(1);
    expect(fn).toHaveBeenCalledTimes(4);
  });

  it("memoize with custom keyFn", () => {
    const fn = vi.fn((a: number, b: number) => a + b);
    const memoized = memoize(fn, { keyFn: (a: number, b: number) => `${a}-${b}` });
    expect(memoized(1, 2)).toBe(3);
    expect(memoized(1, 2)).toBe(3);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("memoizeAsync should cache async results", async () => {
    const fn = vi.fn(async (x: number) => x * 2);
    const memoized = await memoizeAsync(fn);
    const r1 = await memoized(5);
    const r2 = await memoized(5);
    expect(r1).toBe(10);
    expect(r2).toBe(10);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("memoizeAsync should not cache rejected promises", async () => {
    const fn = vi.fn(async () => { throw new Error("fail"); });
    const memoized = await memoizeAsync(fn);
    await expect(memoized()).rejects.toThrow("fail");
    await expect(memoized()).rejects.toThrow("fail");
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("memoizeAsync should deduplicate concurrent calls", async () => {
    let callCount = 0;
    const fn = vi.fn(async (x: number) => {
      callCount++;
      return x * 2;
    });
    const memoized = await memoizeAsync(fn);
    const [r1, r2] = await Promise.all([memoized(5), memoized(5)]);
    expect(r1).toBe(10);
    expect(r2).toBe(10);
    expect(callCount).toBe(1);
  });

  it("deepMemoize should use JSON.stringify key", () => {
    const fn = vi.fn((obj: Record<string, number>) => obj.a + obj.b);
    const memoized = deepMemoize(fn);
    expect(memoized({ a: 1, b: 2 })).toBe(3);
    expect(memoized({ a: 1, b: 2 })).toBe(3);
    expect(fn).toHaveBeenCalledTimes(1);
  });
});

describe("Debounce/Throttle", () => {
  it("debounce should delay execution", () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const debounced = debounce(fn, 100);
    debounced();
    expect(fn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  it("debounce should cancel pending execution", () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const debounced = debounce(fn, 100);
    debounced();
    debounced.cancel();
    vi.advanceTimersByTime(100);
    expect(fn).not.toHaveBeenCalled();
    vi.useRealTimers();
  });

  it("debounce flush should execute immediately", () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const debounced = debounce(fn, 100);
    debounced();
    debounced.flush();
    expect(fn).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  it("debounce should reset timer on repeated calls", () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const debounced = debounce(fn, 100);
    debounced();
    vi.advanceTimersByTime(50);
    debounced();
    vi.advanceTimersByTime(50);
    expect(fn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(50);
    expect(fn).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  it("throttle should limit execution rate", () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const throttled = throttle(fn, 100);
    throttled();
    expect(fn).toHaveBeenCalledTimes(1);
    throttled();
    expect(fn).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });

  it("throttle cancel should clear pending", () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const throttled = throttle(fn, 100);
    throttled();
    throttled();
    throttled.cancel();
    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  it("rafThrottle should use requestAnimationFrame", () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const rafFn = rafThrottle(fn);
    rafFn();
    expect(fn).not.toHaveBeenCalled();
    vi.advanceTimersToNextFrame();
    expect(fn).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  it("leadingDebounce should call immediately then debounce", () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const ld = leadingDebounce(fn, 100);
    ld();
    expect(fn).toHaveBeenCalledTimes(1);
    ld();
    expect(fn).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(100);
    ld();
    expect(fn).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });
});

describe("CacheStore", () => {
  let store: CacheStore<number>;

  beforeEach(() => {
    store = new CacheStore<number>({ ttlMs: 60000 });
  });

  it("should store and retrieve values", () => {
    store.set("key1", 42);
    const result = store.get("key1");
    expect(result).not.toBeNull();
    expect(result!.value).toBe(42);
    expect(result!.stale).toBe(false);
  });

  it("should return null for missing key", () => {
    expect(store.get("nonexistent")).toBeNull();
  });

  it("should evict expired entries", () => {
    vi.useFakeTimers();
    store = new CacheStore<number>({ ttlMs: 100 });
    store.set("key", 1);
    vi.advanceTimersByTime(101);
    expect(store.get("key")).toBeNull();
    vi.useRealTimers();
  });

  it("should track hit/miss stats", () => {
    store.set("k", 1);
    store.get("k");
    store.get("missing");
    const stats = store.stats();
    expect(stats.hits).toBe(1);
    expect(stats.misses).toBe(1);
    expect(stats.hitRate).toBe(50);
  });

  it("has should return true for valid key", () => {
    store.set("k", 1);
    expect(store.has("k")).toBe(true);
  });

  it("has should return false for missing key", () => {
    expect(store.has("nope")).toBe(false);
  });

  it("delete should remove entry", () => {
    store.set("k", 1);
    store.delete("k");
    expect(store.get("k")).toBeNull();
  });

  it("clear should remove all entries", () => {
    store.set("a", 1);
    store.set("b", 2);
    store.clear();
    expect(store.size()).toBe(0);
    expect(store.stats().hits).toBe(0);
  });

  it("getOrFetch should fetch on miss", async () => {
    const fetcher = vi.fn(async () => 99);
    const result = await store.getOrFetch("key", fetcher);
    expect(result).toBe(99);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("getOrFetch should return cached value on hit", async () => {
    store.set("key", 42);
    const fetcher = vi.fn(async () => 99);
    const result = await store.getOrFetch("key", fetcher);
    expect(result).toBe(42);
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("getOrFetch should deduplicate concurrent fetches", async () => {
    let callCount = 0;
    const fetcher = vi.fn(async () => {
      callCount++;
      return callCount;
    });
    const [r1, r2] = await Promise.all([store.getOrFetch("key", fetcher), store.getOrFetch("key", fetcher)]);
    expect(r1).toBe(1);
    expect(r2).toBe(1);
    expect(callCount).toBe(1);
  });

  it("staleWhileRevalidate should return stale value", async () => {
    vi.useFakeTimers();
    store = new CacheStore<number>({ ttlMs: 50, staleWhileRevalidate: true });
    store.set("k", 1);
    vi.advanceTimersByTime(60);
    const result = store.get("k");
    expect(result).not.toBeNull();
    expect(result!.value).toBe(1);
    expect(result!.stale).toBe(true);
    vi.useRealTimers();
  });

  it("should enforce maxSize eviction", () => {
    store = new CacheStore<number>({ maxSize: 2, ttlMs: 60000 });
    store.set("a", 1);
    store.set("b", 2);
    store.set("c", 3);
    expect(store.size()).toBe(2);
  });
});

describe("Cache Module Functions", () => {
  beforeEach(() => {
    cacheClear();
  });

  it("cacheGet/cacheSet should work", () => {
    cacheSet("test", 100);
    expect(cacheGet("test")).toBe(100);
  });

  it("cacheDelete should remove entry", () => {
    cacheSet("x", 1);
    cacheDelete("x");
    expect(cacheGet("x")).toBeNull();
  });

  it("cacheClear should remove all", () => {
    cacheSet("a", 1);
    cacheSet("b", 2);
    cacheClear();
    expect(cacheGet("a")).toBeNull();
    expect(cacheGet("b")).toBeNull();
  });

  it("cacheStats should return stats", () => {
    const stats = cacheStats();
    expect(stats).toHaveProperty("hits");
    expect(stats).toHaveProperty("misses");
    expect(stats).toHaveProperty("hitRate");
  });

  it("withCache should fetch and cache", async () => {
    const fetcher = vi.fn(async () => 42);
    const r1 = await withCache("with-key", fetcher);
    expect(r1).toBe(42);
    const r2 = await withCache("with-key", fetcher);
    expect(r2).toBe(42);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("cacheStoreManager should manage multiple stores", () => {
    const s1 = cacheStoreManager.getOrCreate<number>("test1");
    const s2 = cacheStoreManager.getOrCreate<string>("test2");
    s1.set("k", 1);
    s2.set("k", "v");
    expect(cacheStoreManager.getOrCreate<number>("test1").get("k")!.value).toBe(1);
    const stats = cacheStoreManager.getAllStats();
    expect(stats).toHaveProperty("test1");
    expect(stats).toHaveProperty("test2");
  });

  it("cacheStoreManager clearAll should clear all stores", () => {
    const s1 = cacheStoreManager.getOrCreate<number>("clear-test");
    s1.set("k", 1);
    cacheStoreManager.clearAll();
    expect(s1.get("k")).toBeNull();
  });
});

describe("Async Utilities", () => {
  it("createAsyncQueue should limit concurrency", async () => {
    const queue = createAsyncQueue(2);
    let concurrent = 0;
    let maxConcurrent = 0;
    const tasks = Array.from({ length: 5 }, (_, i) =>
      queue.add(async () => {
        concurrent++;
        maxConcurrent = Math.max(maxConcurrent, concurrent);
        await new Promise((r) => setTimeout(r, 10));
        concurrent--;
        return i;
      }),
    );
    const results = await Promise.all(tasks);
    expect(results).toEqual([0, 1, 2, 3, 4]);
    expect(maxConcurrent).toBeLessThanOrEqual(2);
  });

  it("createAsyncQueue should track size and active", () => {
    const queue = createAsyncQueue(1);
    expect(queue.size).toBe(0);
    expect(queue.active).toBe(0);
    queue.add(async () => { await new Promise((r) => setTimeout(r, 10)); });
    expect(queue.active).toBe(1);
  });

  it("createBatchProcessor should batch items", async () => {
    const batchFn = vi.fn(async (items: number[]) => items.map((x) => x * 2));
    const processor = createBatchProcessor(batchFn, { maxBatchSize: 3 });
    const results = await Promise.all([processor.add(1), processor.add(2), processor.add(3)]);
    expect(results).toEqual([2, 4, 6]);
    expect(batchFn).toHaveBeenCalledTimes(1);
    expect(batchFn).toHaveBeenCalledWith([1, 2, 3]);
  });

  it("createBatchProcessor should flush after maxWaitMs", async () => {
    vi.useFakeTimers();
    const batchFn = vi.fn(async (items: number[]) => items.map((x) => x * 2));
    const processor = createBatchProcessor(batchFn, { maxBatchSize: 10, maxWaitMs: 50 });
    const promise = processor.add(42);
    vi.advanceTimersByTime(50);
    const result = await promise;
    expect(result).toBe(84);
    expect(batchFn).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  it("createRetryStrategy should retry on failure", async () => {
    let attempts = 0;
    const fn = vi.fn(async () => {
      attempts++;
      if (attempts < 3) throw new Error("fail");
      return "success";
    });
    const strategy = createRetryStrategy(fn, { maxRetries: 3, baseDelayMs: 10 });
    const result = await strategy.execute();
    expect(result).toBe("success");
    expect(attempts).toBe(3);
  });

  it("createRetryStrategy should throw after max retries", async () => {
    const fn = vi.fn(async () => { throw new Error("always fail"); });
    const strategy = createRetryStrategy(fn, { maxRetries: 2, baseDelayMs: 10 });
    await expect(strategy.execute()).rejects.toThrow("always fail");
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("createRetryStrategy reset should clear attempt counter", async () => {
    let attempts = 0;
    const fn = vi.fn(async () => {
      attempts++;
      if (attempts < 2) throw new Error("fail");
      return "ok";
    });
    const strategy = createRetryStrategy(fn, { maxRetries: 3, baseDelayMs: 10 });
    strategy.reset();
    const result = await strategy.execute();
    expect(result).toBe("ok");
  });

  it("timeout should reject if promise is slow", async () => {
    await expect(timeout(new Promise((r) => setTimeout(r, 1000)), 10, "too slow")).rejects.toThrow("too slow");
  });

  it("timeout should resolve if promise is fast", async () => {
    const result = await timeout(Promise.resolve("fast"), 1000);
    expect(result).toBe("fast");
  });
});

describe("Performance Measurement", () => {
  beforeEach(() => {
    clearPerformanceMarks();
  });

  it("createPerformanceTimer should measure duration", () => {
    const timer = createPerformanceTimer("test");
    timer.start();
    const elapsed = timer.end();
    expect(elapsed).toBeGreaterThanOrEqual(0);
  });

  it("createPerformanceTimer end without start returns 0", () => {
    const timer = createPerformanceTimer("test");
    expect(timer.end()).toBe(0);
  });

  it("measureSync should return result and duration", () => {
    const { result, durationMs } = measureSync("sync-test", () => 1 + 2);
    expect(result).toBe(3);
    expect(durationMs).toBeGreaterThanOrEqual(0);
  });

  it("measureSync should record mark", () => {
    measureSync("sync-mark", () => 42);
    const marks = getPerformanceMarks();
    expect(marks["sync-mark"]).toBeGreaterThanOrEqual(0);
  });

  it("measureAsync should return result and duration", async () => {
    const { result, durationMs } = await measureAsync("async-test", async () => "hello");
    expect(result).toBe("hello");
    expect(durationMs).toBeGreaterThanOrEqual(0);
  });

  it("getPerformanceMarks should return all marks", () => {
    measureSync("mark-a", () => 1);
    measureSync("mark-b", () => 2);
    const marks = getPerformanceMarks();
    expect(Object.keys(marks)).toContain("mark-a");
    expect(Object.keys(marks)).toContain("mark-b");
  });

  it("clearPerformanceMarks should clear all marks", () => {
    measureSync("temp", () => 1);
    clearPerformanceMarks();
    expect(Object.keys(getPerformanceMarks())).toHaveLength(0);
  });
});

describe("Storage Cache", () => {
  describe("MemoryStorageCache", () => {
    it("should store and retrieve values", () => {
      const cache = new MemoryStorageCache<number>();
      cache.set("key", 42);
      expect(cache.get("key")).toBe(42);
    });

    it("should return null for missing key", () => {
      const cache = new MemoryStorageCache<number>();
      expect(cache.get("missing")).toBeNull();
    });

    it("should expire entries after TTL", () => {
      vi.useFakeTimers();
      const cache = new MemoryStorageCache<number>();
      cache.set("key", 1, 100);
      vi.advanceTimersByTime(101);
      expect(cache.get("key")).toBeNull();
      vi.useRealTimers();
    });

    it("delete should remove entry", () => {
      const cache = new MemoryStorageCache<number>();
      cache.set("k", 1);
      cache.delete("k");
      expect(cache.get("k")).toBeNull();
    });

    it("clear should remove all entries", () => {
      const cache = new MemoryStorageCache<number>();
      cache.set("a", 1);
      cache.set("b", 2);
      cache.clear();
      expect(cache.size()).toBe(0);
    });

    it("size should return correct count", () => {
      const cache = new MemoryStorageCache<number>();
      expect(cache.size()).toBe(0);
      cache.set("a", 1);
      expect(cache.size()).toBe(1);
    });
  });

  describe("SessionStorageCache", () => {
    beforeEach(() => {
      sessionStorage.clear();
    });

    it("should store and retrieve values", () => {
      const cache = new SessionStorageCache<string>("test_");
      cache.set("greeting", "hello");
      expect(cache.get("greeting")).toBe("hello");
    });

    it("should return null for missing key", () => {
      const cache = new SessionStorageCache<string>("test_");
      expect(cache.get("nope")).toBeNull();
    });

    it("delete should remove entry", () => {
      const cache = new SessionStorageCache<string>("test_");
      cache.set("k", "v");
      cache.delete("k");
      expect(cache.get("k")).toBeNull();
    });

    it("clear should remove only prefixed keys", () => {
      sessionStorage.setItem("other", "keep");
      const cache = new SessionStorageCache<string>("myprefix_");
      cache.set("a", "1");
      cache.clear();
      expect(cache.get("a")).toBeNull();
      expect(sessionStorage.getItem("other")).toBe("keep");
    });

    it("size should count only prefixed keys", () => {
      sessionStorage.setItem("other", "keep");
      const cache = new SessionStorageCache<string>("sz_");
      cache.set("x", "1");
      cache.set("y", "2");
      expect(cache.size()).toBe(2);
    });
  });

  describe("LocalStorageCache", () => {
    beforeEach(() => {
      localStorage.clear();
    });

    it("should store and retrieve values", () => {
      const cache = new LocalStorageCache<number>("ls_");
      cache.set("num", 100);
      expect(cache.get("num")).toBe(100);
    });

    it("should return null for missing key", () => {
      const cache = new LocalStorageCache<number>("ls_");
      expect(cache.get("missing")).toBeNull();
    });

    it("delete should remove entry", () => {
      const cache = new LocalStorageCache<string>("ls_");
      cache.set("k", "v");
      cache.delete("k");
      expect(cache.get("k")).toBeNull();
    });

    it("clear should remove only prefixed keys", () => {
      localStorage.setItem("keep", "stay");
      const cache = new LocalStorageCache<string>("ls_");
      cache.set("a", "1");
      cache.clear();
      expect(cache.get("a")).toBeNull();
      expect(localStorage.getItem("keep")).toBe("stay");
    });

    it("size should count prefixed keys", () => {
      const cache = new LocalStorageCache<string>("sz_");
      cache.set("a", "1");
      cache.set("b", "2");
      cache.set("c", "3");
      expect(cache.size()).toBe(3);
    });
  });
});

describe("Performance Monitor Edge Cases", () => {
  it("should handle MAX_RECORDS limit", () => {
    performanceMonitor.reset();
    for (let i = 0; i < 11000; i++) {
      performanceMonitor.recordMetric({ name: "bulk", value: i, unit: "count", timestamp: "", tags: {} });
    }
    expect(performanceMonitor.getMetrics("bulk").length).toBeLessThanOrEqual(10000);
  });

  it("getLastMetric should return null when no matching metric", () => {
    performanceMonitor.reset();
    const summary = performanceMonitor.computeSummary();
    expect(summary.lcpMs).toBe(0);
  });

  it("computeSummary with no data should return zeros", () => {
    performanceMonitor.reset();
    const summary = performanceMonitor.computeSummary();
    expect(summary.avgPageLoadMs).toBe(0);
    expect(summary.avgApiLatencyMs).toBe(0);
    expect(summary.totalRequests).toBe(0);
    expect(summary.errorRate).toBe(0);
  });

  it("getHealthCheck should detect unhealthy when avg latency is high", () => {
    performanceMonitor.reset();
    for (let i = 0; i < 5; i++) {
      performanceMonitor.recordApiLatency({ path: "/api/slow", method: "GET", durationMs: 1500, statusCode: 200, timestamp: "", correlationId: `s${i}` });
    }
    const health = performanceMonitor.getHealthCheck();
    expect(health.checks.api.status).toBe("unhealthy");
  });

  it("getHealthCheck should detect degraded cache hit rate", () => {
    performanceMonitor.reset();
    const store = cacheStoreManager.getOrCreate<number>("degraded-cache");
    for (let i = 0; i < 10; i++) {
      store.get(`k${i}`); // All misses
    }
    const health = performanceMonitor.getHealthCheck();
    expect(health.checks.cache.status).toBe("unhealthy");
  });

  it("performanceMiddleware recordWebVital fid should use ms unit", () => {
    performanceMiddleware.recordWebVital("fid", 50);
    const metrics = performanceMonitor.getMetrics("fid");
    expect(metrics[0].unit).toBe("ms");
  });

  it("computeSummary should return p50/p95/p99 correctly sorted", () => {
    performanceMonitor.reset();
    const latencies = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
    latencies.forEach((d, i) => {
      performanceMonitor.recordApiLatency({ path: "/api/t", method: "GET", durationMs: d, statusCode: 200, timestamp: "", correlationId: `c${i}` });
    });
    const summary = performanceMonitor.computeSummary();
    expect(summary.p50LatencyMs).toBeGreaterThanOrEqual(50);
    expect(summary.p50LatencyMs).toBeLessThanOrEqual(60);
  });

  it("recordMetric with same name multiple times should store all", () => {
    performanceMonitor.reset();
    performanceMonitor.recordMetric({ name: "page_load", value: 100, unit: "ms", timestamp: "", tags: {} });
    performanceMonitor.recordMetric({ name: "page_load", value: 200, unit: "ms", timestamp: "", tags: {} });
    performanceMonitor.recordMetric({ name: "page_load", value: 300, unit: "ms", timestamp: "", tags: {} });
    expect(performanceMonitor.getMetrics("page_load")).toHaveLength(3);
  });

  it("computeSummary should handle partial data", () => {
    performanceMonitor.reset();
    performanceMonitor.recordApiLatency({ path: "/api/test", method: "GET", durationMs: 200, statusCode: 200, timestamp: "", correlationId: "c" });
    performanceMonitor.recordMetric({ name: "page_load", value: 1000, unit: "ms", timestamp: "", tags: {} });
    const summary = performanceMonitor.computeSummary();
    expect(summary.avgApiLatencyMs).toBe(200);
    expect(summary.avgPageLoadMs).toBe(1000);
  });
});
