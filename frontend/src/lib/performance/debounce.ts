// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyFn = (...args: any[]) => void;

export function debounce<T extends AnyFn>(
  fn: T,
  delayMs: number,
): { (...args: Parameters<T>): void; cancel: () => void; flush: () => void } {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: Parameters<T> | null = null;

  const debounced = (...args: Parameters<T>) => {
    lastArgs = args;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      fn(...args);
    }, delayMs);
  };

  debounced.cancel = () => {
    if (timer) clearTimeout(timer);
    timer = null;
    lastArgs = null;
  };

  debounced.flush = () => {
    if (timer && lastArgs) {
      clearTimeout(timer);
      timer = null;
      fn(...lastArgs);
      lastArgs = null;
    }
  };

  return debounced;
}

export function throttle<T extends AnyFn>(
  fn: T,
  limitMs: number,
): { (...args: Parameters<T>): void; cancel: () => void } {
  let inThrottle = false;
  let lastArgs: Parameters<T> | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;

  const throttled = (...args: Parameters<T>) => {
    if (inThrottle) {
      lastArgs = args;
      return;
    }
    inThrottle = true;
    fn(...args);
    timer = setTimeout(() => {
      inThrottle = false;
      if (lastArgs) {
        fn(...lastArgs);
        lastArgs = null;
      }
    }, limitMs);
  };

  throttled.cancel = () => {
    if (timer) clearTimeout(timer);
    inThrottle = false;
    lastArgs = null;
  };

  return throttled;
}

export function rafThrottle<T extends AnyFn>(fn: T): (...args: Parameters<T>) => void {
  let rafId: number | null = null;
  let lastArgs: Parameters<T> | null = null;

  return (...args: Parameters<T>) => {
    lastArgs = args;
    if (rafId !== null) return;
    rafId = requestAnimationFrame(() => {
      rafId = null;
      if (lastArgs) fn(...lastArgs);
      lastArgs = null;
    });
  };
}

export function leadingDebounce<T extends AnyFn>(
  fn: T,
  delayMs: number,
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let leadingCalled = false;

  return (...args: Parameters<T>) => {
    if (!leadingCalled) {
      fn(...args);
      leadingCalled = true;
    }
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      leadingCalled = false;
      timer = null;
    }, delayMs);
  };
}
