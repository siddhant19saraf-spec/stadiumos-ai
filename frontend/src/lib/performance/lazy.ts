// @ts-nocheck
import { lazy } from "react";
import type { ComponentType } from "react";

export function lazyImport<T extends Record<string, ComponentType<any>>>(
  factory: () => Promise<T>,
  name: keyof T,
): T[keyof T] {
  return lazy(() => factory().then((module) => ({ default: module[name] })));
}

export function lazyComponent(
  factory: () => Promise<{ default: ComponentType<any> }>,
  displayName?: string,
) {
  const Component = lazy(factory);
  if (displayName) Component.displayName = displayName;
  return Component;
}

