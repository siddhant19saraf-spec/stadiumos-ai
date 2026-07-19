import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  label?: string;
}

export function LoadingSpinner({ size = "md", className, label }: LoadingSpinnerProps) {
  const sizeMap = { sm: "h-4 w-4", md: "h-6 w-6", lg: "h-8 w-8" };

  return (
    <div
      className={cn("flex items-center justify-center", className)}
      role="status"
      aria-label={label ?? "Loading"}
    >
      <Loader2 className={cn("animate-spin text-muted-foreground", sizeMap[size])} aria-hidden="true" />
      {label && <span className="ml-2 text-sm text-muted-foreground">{label}</span>}
    </div>
  );
}

interface LoadingPageProps {
  message?: string;
}

export function LoadingPage({ message = "Loading..." }: LoadingPageProps) {
  return (
    <div
      className="flex min-h-[400px] items-center justify-center"
      role="status"
      aria-label={message}
    >
      <div className="flex flex-col items-center gap-4">
        <LoadingSpinner size="lg" />
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}

interface LoadingCardProps {
  lines?: number;
  className?: string;
}

export function LoadingCard({ lines = 3, className }: LoadingCardProps) {
  return (
    <Card className={cn("animate-pulse", className)} aria-hidden="true">
      <CardHeader>
        <div className="h-4 w-1/3 rounded bg-muted" />
        <div className="mt-2 h-3 w-1/2 rounded bg-muted" />
      </CardHeader>
      <CardContent>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={cn("h-3 rounded bg-muted", i < lines - 1 && "mb-2")}
            style={{ width: `${70 + Math.random() * 30}%` }}
          />
        ))}
      </CardContent>
    </Card>
  );
}

interface LoadingGridProps {
  count?: number;
  columns?: 2 | 3 | 4;
}

export function LoadingGrid({ count = 4, columns = 3 }: LoadingGridProps) {
  const gridCols = {
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
  };

  return (
    <div className={cn("grid gap-4", gridCols[columns])} aria-label="Loading content">
      {Array.from({ length: count }).map((_, i) => (
        <LoadingCard key={i} />
      ))}
    </div>
  );
}
