import { useEffect, useCallback, type RefObject } from "react";

export type KeyHandler = (e: KeyboardEvent) => void;

export function useKeyboard(
  keyMap: Record<string, KeyHandler>,
  deps: unknown[] = [],
): void {
  const handler = useCallback(
    (e: KeyboardEvent) => {
      const entry = keyMap[e.key as string];
      if (entry) {
        entry(e);
      }
    },
    [keyMap],
  );

  useEffect(() => {
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [handler]);
}

export function useEscape(
  onEscape: () => void,
  deps: unknown[] = [],
): void {
  useKeyboard({ Escape: (e) => { e.preventDefault(); onEscape(); } }, deps);
}

export function useArrowNavigation(
  containerRef: RefObject<HTMLElement | null>,
  options: { vertical?: boolean; horizontal?: boolean; loop?: boolean } = {},
): void {
  const { vertical = true, horizontal = false, loop = false } = options;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handler = (e: KeyboardEvent) => {
      const isVertical = vertical && (e.key === "ArrowUp" || e.key === "ArrowDown");
      const isHorizontal = horizontal && (e.key === "ArrowLeft" || e.key === "ArrowRight");
      if (!isVertical && !isHorizontal) return;

      e.preventDefault();
      const items = Array.from(
        container.querySelectorAll<HTMLElement>(
          '[role="menuitem"], [role="option"], [role="tab"], [role="radio"], [role="listbox"] [role="option"], a, button:not([disabled])',
        ),
      );
      if (items.length === 0) return;

      const currentIndex = items.indexOf(document.activeElement as HTMLElement);
      const direction = e.key === "ArrowDown" || e.key === "ArrowRight" ? 1 : -1;
      let nextIndex = currentIndex + direction;

      if (loop) {
        nextIndex = ((nextIndex % items.length) + items.length) % items.length;
      } else {
        nextIndex = Math.max(0, Math.min(nextIndex, items.length - 1));
      }

      if (nextIndex !== currentIndex) {
        items[nextIndex]?.focus();
      }
    };

    container.addEventListener("keydown", handler);
    return () => container.removeEventListener("keydown", handler);
  }, [containerRef, vertical, horizontal, loop]);
}

export function useShortcut(
  key: string,
  handler: () => void,
  modifiers: { ctrl?: boolean; alt?: boolean; shift?: boolean } = {},
): void {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== key.toLowerCase()) return;
      if (modifiers.ctrl && !e.ctrlKey) return;
      if (modifiers.alt && !e.altKey) return;
      if (modifiers.shift && !e.shiftKey) return;
      e.preventDefault();
      handler();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [key, handler, modifiers]);
}
