import { Suspense, type ComponentType, type ReactNode } from "react";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Props = Record<string, any>;

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
  Component: ComponentType<Props>,
  fallback?: ReactNode,
): ComponentType<Props> {
  const Wrapped = (props: Props) => (
    <Suspense fallback={fallback ?? <SuspenseFallback />}>
      <Component {...props} />
    </Suspense>
  );
  Wrapped.displayName = `Suspense(${Component.displayName ?? Component.name ?? "Component"})`;
  return Wrapped;
}
