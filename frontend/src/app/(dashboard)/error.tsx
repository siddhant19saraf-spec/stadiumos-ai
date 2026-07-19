"use client";

import { ErrorFallback } from "@/components/error-fallback";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorFallback
      title="Dashboard Error"
      message={error.message ?? "An unexpected error occurred loading the dashboard."}
      onRetry={reset}
    />
  );
}
