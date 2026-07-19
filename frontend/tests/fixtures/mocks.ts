import { vi } from "vitest";

export function createMockFetch<T>(data: T, ok = true, status = 200): ReturnType<typeof vi.fn> {
  return vi.fn().mockResolvedValue({
    ok,
    status,
    json: () => Promise.resolve({ data, message: "Success", status, timestamp: new Date().toISOString() }),
  });
}

export function createMockFetchError(message = "Network error", status = 500): ReturnType<typeof vi.fn> {
  return vi.fn().mockRejectedValue(new Error(message));
}

export function createMockAbortError(): ReturnType<typeof vi.fn> {
  const error = new DOMException("The operation was aborted", "AbortError");
  return vi.fn().mockRejectedValue(error);
}

export function mockLocalStorage(storage: Record<string, string> = {}): void {
  const store = { ...storage };
  vi.spyOn(Storage.prototype, "getItem").mockImplementation((key: string) => store[key] ?? null);
  vi.spyOn(Storage.prototype, "setItem").mockImplementation((key: string, value: string) => { store[key] = value; });
  vi.spyOn(Storage.prototype, "removeItem").mockImplementation((key: string) => { delete store[key]; });
  vi.spyOn(Storage.prototype, "clear").mockImplementation(() => { Object.keys(store).forEach((k) => delete store[k]); });
}

export function createMockIntersectionObserver(): void {
  class MockIntersectionObserver {
    readonly root: Element | Document | null = null;
    readonly rootMargin: string = "";
    readonly thresholds: ReadonlyArray<number> = [];
    constructor() {}
    observe() { return null; }
    unobserve() { return null; }
    disconnect() { return null; }
    takeRecords() { return []; }
  }
  vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);
}

export function createMockResizeObserver(): void {
  class MockResizeObserver {
    constructor() {}
    observe() { return null; }
    unobserve() { return null; }
    disconnect() { return null; }
  }
  vi.stubGlobal("ResizeObserver", MockResizeObserver);
}

export function createMockMatchMedia(matches = false): void {
  vi.stubGlobal("matchMedia", vi.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })));
}

export function createMockNavigatorMedia(): void {
  Object.defineProperty(globalThis.navigator, "mediaDevices", {
    value: {
      getUserMedia: vi.fn().mockResolvedValue({}),
      enumerateDevices: vi.fn().mockResolvedValue([]),
    },
    writable: true,
    configurable: true,
  });
}

export function mockConsole(): void {
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
}

export function mockDateNow(isoString: string): void {
  const now = new Date(isoString).getTime();
  vi.spyOn(Date, "now").mockReturnValue(now);
}

export function createPerformanceObserverMock(): void {
  class MockPerformanceObserver {
    observe() { return null; }
    disconnect() { return null; }
    takeRecords() { return []; }
  }
  vi.stubGlobal("PerformanceObserver", MockPerformanceObserver);
}
