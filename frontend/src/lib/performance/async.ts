export function createAsyncQueue(concurrency = 3) {
  const queue: (() => Promise<any>)[] = [];
  let activeCount = 0;

  async function processNext(): Promise<void> {
    if (activeCount >= concurrency || queue.length === 0) return;
    activeCount++;
    const task = queue.shift()!;
    try {
      await task();
    } catch {
      // task failed, continue
    } finally {
      activeCount--;
      processNext();
    }
  }

  return {
    add: <T>(task: () => Promise<T>): Promise<T> => {
      return new Promise<T>((resolve, reject) => {
        queue.push(async () => {
          try { resolve(await task()); }
          catch (e) { reject(e); }
        });
        processNext();
      });
    },
    get size() { return queue.length; },
    get active() { return activeCount; },
  };
}

export function createBatchProcessor<T, R>(
  batchFn: (items: T[]) => Promise<R[]>,
  options: { maxBatchSize?: number; maxWaitMs?: number } = {},
) {
  const { maxBatchSize = 50, maxWaitMs = 50 } = options;
  let batch: T[] = [];
  let timer: ReturnType<typeof setTimeout> | null = null;
  let resolvers: { resolve: (value: R) => void; reject: (reason: unknown) => void }[] = [];

  async function flush() {
    if (timer) { clearTimeout(timer); timer = null; }
    if (batch.length === 0) return;
    const items = [...batch];
    const pending = [...resolvers];
    batch = [];
    resolvers = [];
    try {
      const results = await batchFn(items);
      for (let i = 0; i < results.length; i++) pending[i]?.resolve(results[i] as R);
    } catch (e) {
      for (const p of pending) p.reject(e);
    }
  }

  return {
    add: (item: T): Promise<R> => {
      return new Promise<R>((resolve, reject) => {
        batch.push(item);
        resolvers.push({ resolve, reject });
        if (batch.length >= maxBatchSize) flush();
        else if (!timer) timer = setTimeout(flush, maxWaitMs);
      });
    },
    flush,
    get size() { return batch.length; },
  };
}

export function createRetryStrategy<T>(
  fn: () => Promise<T>,
  options: { maxRetries?: number; baseDelayMs?: number; maxDelayMs?: number } = {},
): { execute: () => Promise<T>; reset: () => void } {
  const { maxRetries = 3, baseDelayMs = 200, maxDelayMs = 5000 } = options;
  let attempt = 0;

  const execute = async (): Promise<T> => {
    try {
      attempt++;
      return await fn();
    } catch (error) {
      if (attempt >= maxRetries) throw error;
      const delay = Math.min(baseDelayMs * Math.pow(2, attempt - 1) + Math.random() * 100, maxDelayMs);
      await new Promise((r) => setTimeout(r, delay));
      return execute();
    }
  };

  return { execute, reset: () => { attempt = 0; } };
}

export function timeout<T>(promise: Promise<T>, ms: number, message = "Operation timed out"): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(message)), ms)),
  ]);
}

