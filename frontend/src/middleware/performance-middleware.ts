import { performanceMonitor } from "@/services/performance-monitor";

export interface IPerformanceMiddleware {
  recordApiCall(path: string, method: string, durationMs: number, statusCode: number, correlationId: string): void;
  recordPageLoad(route: string, durationMs: number): void;
  recordAiResponse(engine: string, durationMs: number): void;
  recordWebVital(metric: "lcp" | "inp" | "cls" | "fid", value: number): void;
  getRequestTimingHeader(startTime: number): { "X-Response-Time-Ms": string; "X-Request-Id"?: string };
  createTimer(): { start: () => number; elapsed: () => number };
}

export class PerformanceMiddleware implements IPerformanceMiddleware {
  recordApiCall(path: string, method: string, durationMs: number, statusCode: number, correlationId: string): void {
    performanceMonitor.recordApiLatency({
      path, method, durationMs, statusCode,
      timestamp: new Date().toISOString(),
      correlationId,
    });
  }

  recordPageLoad(route: string, durationMs: number): void {
    performanceMonitor.recordMetric({
      name: "page_load", value: durationMs, unit: "ms",
      timestamp: new Date().toISOString(),
      tags: { route },
    });
  }

  recordAiResponse(engine: string, durationMs: number): void {
    performanceMonitor.recordMetric({
      name: "ai_response", value: durationMs, unit: "ms",
      timestamp: new Date().toISOString(),
      tags: { engine },
    });
  }

  recordWebVital(metric: "lcp" | "inp" | "cls" | "fid", value: number): void {
    performanceMonitor.recordMetric({
      name: metric, value, unit: metric === "cls" ? "score" : "ms",
      timestamp: new Date().toISOString(),
      tags: {},
    });
  }

  getRequestTimingHeader(startTime: number) {
    return { "X-Response-Time-Ms": String(Date.now() - startTime) };
  }

  createTimer(): { start: () => number; elapsed: () => number } {
    const start = performance.now();
    return {
      start: () => start,
      elapsed: () => performance.now() - start,
    };
  }
}

export const performanceMiddleware = new PerformanceMiddleware();
