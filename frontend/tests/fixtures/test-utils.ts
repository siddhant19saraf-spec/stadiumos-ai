// @ts-nocheck
import { vi, type MockInstance } from "vitest";

export function expectCalledOnce(mock: MockInstance, ...args: unknown[]): void {
  expect(mock).toHaveBeenCalledTimes(1);
  if (args.length > 0) {
    expect(mock).toHaveBeenCalledWith(...args);
  }
}

export function expectNeverCalled(mock: MockInstance): void {
  expect(mock).not.toHaveBeenCalled();
}

export function expectAsyncToReject(fn: () => Promise<unknown>, errorMessage?: string | RegExp): Promise<void> {
  const promise = fn();
  if (errorMessage) {
    return expect(promise).rejects.toThrow(errorMessage);
  }
  return expect(promise).rejects.toThrow();
}

export function expectType<T>(value: T): void {
  expect(value).toBeDefined();
}

export function generateTimestamps(count: number, intervalMs = 60000): string[] {
  const base = Date.now();
  return Array.from({ length: count }, (_, i) => new Date(base + i * intervalMs).toISOString());
}

export function generateSequence<T>(factory: (index: number) => T, count: number): T[] {
  return Array.from({ length: count }, (_, i) => factory(i));
}

export function createAsyncIterator<T>(items: T[], delayMs = 0): {
  [Symbol.asyncIterator]: () => AsyncIterator<T>;
} {
  return {
    async *[Symbol.asyncIterator]() {
      for (const item of items) {
        if (delayMs > 0) await new Promise((r) => setTimeout(r, delayMs));
        yield item;
      }
    },
  };
}

export function withFrozenTime<T>(isoString: string, fn: () => T): T {
  const spy = vi.spyOn(Date, "now").mockReturnValue(new Date(isoString).getTime());
  const result = fn();
  spy.mockRestore();
  return result;
}

export function expectRange(value: number, min: number, max: number): void {
  expect(value).toBeGreaterThanOrEqual(min);
  expect(value).toBeLessThanOrEqual(max);
}

export function expectDefined<T>(value: T | null | undefined): asserts value is T {
  expect(value).toBeDefined();
}

