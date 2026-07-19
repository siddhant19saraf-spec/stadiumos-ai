"use client";

import { usePrefersReducedMotion } from "@/lib/a11y/motion";

interface LoadingSpinnerProps {
  label?: string;
  size?: "sm" | "md" | "lg";
}

const sizes = { sm: "h-4 w-4", md: "h-6 w-6", lg: "h-10 w-10" };

export function LoadingSpinner({ label = "Loading...", size = "md" }: LoadingSpinnerProps) {
  const reducedMotion = usePrefersReducedMotion();

  return (
    <div role="status" aria-label={label} className="inline-flex items-center gap-2">
      <svg
        className={`${sizes[size]} ${reducedMotion ? "" : "animate-spin"}`}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
      <span className="sr-only">{label}</span>
    </div>
  );
}

export function LoadingDots({ label = "Loading" }: { label?: string }) {
  const reducedMotion = usePrefersReducedMotion();

  return (
    <div role="status" aria-label={label} className="inline-flex items-center gap-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={`h-2 w-2 rounded-full bg-current ${reducedMotion ? "" : "animate-bounce"}`}
          style={reducedMotion ? {} : { animationDelay: `${i * 150}ms` }}
          aria-hidden="true"
        />
      ))}
      <span className="sr-only">{label}</span>
    </div>
  );
}

export function LoadingSkeleton({ lines = 3, className = "" }: { lines?: number; className?: string }) {
  return (
    <div role="status" aria-label="Loading content" className={`space-y-3 ${className}`}>
      <div className="sr-only">Loading content...</div>
      {Array.from({ length: lines }, (_, i) => (
        <div
          key={i}
          className="h-4 rounded bg-white/10 animate-pulse"
          style={{ width: `${70 + (i === lines - 1 ? 0 : Math.random() * 25)}%` }}
        />
      ))}
    </div>
  );
}
