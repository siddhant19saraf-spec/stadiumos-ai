const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
  "details summary",
  "audio[controls]",
  "video[controls]",
].join(", ");

export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
}

export function getFirstFocusable(container: HTMLElement): HTMLElement | null {
  return getFocusableElements(container)[0] ?? null;
}

export function getLastFocusable(container: HTMLElement): HTMLElement | null {
  const elements = getFocusableElements(container);
  return elements[elements.length - 1] ?? null;
}

export function trapFocus(container: HTMLElement): () => void {
  const handler = (e: KeyboardEvent) => {
    if (e.key !== "Tab") return;
    const elements = getFocusableElements(container);
    if (elements.length === 0) return;
    const first = elements[0]!;
    const last = elements[elements.length - 1]!;
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };
  document.addEventListener("keydown", handler);
  return () => document.removeEventListener("keydown", handler);
}

export function focusFirstElement(container: HTMLElement): void {
  const target = getFirstFocusable(container) ?? container;
  target.focus();
}

export function restoreFocus(previous: HTMLElement | null): void {
  requestAnimationFrame(() => previous?.focus());
}

export function createFocusScope(containerRef: React.RefObject<HTMLElement | null>): {
  activate: () => void;
  deactivate: () => void;
} {
  let cleanup: (() => void) | null = null;
  return {
    activate: () => {
      if (!containerRef.current) return;
      focusFirstElement(containerRef.current);
      cleanup = trapFocus(containerRef.current);
    },
    deactivate: () => {
      cleanup?.();
      cleanup = null;
    },
  };
}
