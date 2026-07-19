import { Suspense, type ComponentType, type ReactNode } from "react";

export function SuspenseFallback({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="flex h-40 items-center justify-center" role="status">
      <div className="flex items-center gap-2">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <span className="text-xs text-muted-foreground">{message}</span>
      </div>
      <span className="sr-only">Loading</span>
    </div>
  );
}

export function createSuspenseWrapper(
  Component: ComponentType<Record<string, unknown>>,
  fallback?: ReactNode,
): ComponentType<Record<string, unknown>> {
  const Wrapped = (props: Record<string, unknown>) => (
    <Suspense fallback={fallback ?? <SuspenseFallback />}>
      <Component {...props} />
    </Suspense>
  );
  Wrapped.displayName = `Suspense(${Component.displayName ?? Component.name ?? "Component"})`;
  return Wrapped;
}
