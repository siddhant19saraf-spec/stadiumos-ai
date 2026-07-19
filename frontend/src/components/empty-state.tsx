import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Inbox } from "lucide-react";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex min-h-[300px] flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center",
        className,
      )}
      role="status"
      aria-label={title}
    >
      <div className="mb-4 text-muted-foreground" aria-hidden="true">
        {icon ?? <Inbox className="h-12 w-12" aria-hidden="true" />}
      </div>
      <h2 className="mb-1 text-lg font-semibold text-foreground">{title}</h2>
      {description && (
        <p className="mb-4 max-w-sm text-sm text-muted-foreground">{description}</p>
      )}
      {action && (
        <Button onClick={action.onClick} variant="outline" size="sm" aria-label={action.label}>
          {action.label}
        </Button>
      )}
    </div>
  );
}
