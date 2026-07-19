const marks = new Map<string, number>();

export function createPerformanceTimer(name: string): { start: () => void; end: () => number } {
  let started = false;
  let startTime = 0;

  return {
    start: () => {
      started = true;
      startTime = performance.now();
    },
    end: () => {
      if (!started) return 0;
      started = false;
      return performance.now() - startTime;
    },
  };
}

export function measureSync<T>(name: string, fn: () => T): { result: T; durationMs: number } {
  const start = performance.now();
  const result = fn();
  const durationMs = performance.now() - start;
  marks.set(name, durationMs);
  return { result, durationMs };
}

export async function measureAsync<T>(name: string, fn: () => Promise<T>): Promise<{ result: T; durationMs: number }> {
  const start = performance.now();
  const result = await fn();
  const durationMs = performance.now() - start;
  marks.set(name, durationMs);
  return { result, durationMs };
}

export function getPerformanceMarks(): Record<string, number> {
  return Object.fromEntries(marks);
}

export function clearPerformanceMarks(): void {
  marks.clear();
}

