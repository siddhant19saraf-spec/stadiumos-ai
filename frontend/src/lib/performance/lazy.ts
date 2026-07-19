import { lazy } from "react";
import type { ComponentType } from "react";

export function lazyImport<T extends Record<string, ComponentType<Record<string, unknown>>>>(
  factory: () => Promise<T>,
  name: keyof T,
): T[keyof T] {
  return lazy(() => factory().then((module) => ({ default: module[name] }))) as unknown as T[keyof T];
}

export function lazyComponent(
  factory: () => Promise<{ default: ComponentType<Record<string, unknown>> }>,
  displayName?: string,
) {
  const Component = lazy(factory);
  if (displayName) (Component as { displayName?: string }).displayName = displayName;
  return Component;
}
