"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Bot, User, Loader2, AlertCircle, CheckCircle2, Brain, Target, ArrowRight, Gauge } from "lucide-react";
import type { CopilotMessage, Priority } from "../types";

interface CopilotMessageProps {
  message: CopilotMessage;
  className?: string;
}

const priorityConfig: Record<Priority, { label: string; color: string }> = {
  critical: { label: "Critical", color: "text-red-400 border-red-500/30 bg-red-500/10" },
  high: { label: "High", color: "text-amber-400 border-amber-500/30 bg-amber-500/10" },
  medium: { label: "Medium", color: "text-blue-400 border-blue-500/30 bg-blue-500/10" },
  low: { label: "Low", color: "text-muted-foreground border-border bg-muted/50" },
};

export function CopilotMessageView({ message, className }: CopilotMessageProps) {
  const isUser = message.role === "user";
  const isStreaming = message.status === "streaming";
  const isError = message.status === "error";

  return (
    <div
      className={cn(
        "flex gap-3",
        isUser ? "flex-row-reverse" : "flex-row",
        className,
      )}
      role="listitem"
      aria-label={isUser ? "Your message" : `AI copilot response${isStreaming ? " (streaming)" : ""}`}
    >
      {/* Avatar */}
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
          isUser ? "bg-primary/20" : "bg-amber-500/20",
        )}
        aria-hidden="true"
      >
        {isUser ? (
          <User className="h-4 w-4 text-primary" />
        ) : (
          <Bot className="h-4 w-4 text-amber-400" />
        )}
      </div>

      {/* Content */}
      <div className={cn("flex max-w-[85%] flex-col gap-1", isUser && "items-end")}>
        <div
          className={cn(
            "rounded-xl px-4 py-3 text-sm",
            isUser
              ? "bg-primary text-primary-foreground"
              : isError
                ? "border border-red-500/30 bg-red-500/5"
                : "border border-border bg-card",
          )}
        >
          {isStreaming && !message.content ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              <span>AI is analyzing...</span>
            </div>
          ) : isUser ? (
            <p className="leading-relaxed">{message.content}</p>
          ) : (
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <div className="whitespace-pre-wrap leading-relaxed text-foreground/90">
                {message.content}
              </div>
            </div>
          )}

          {isStreaming && message.content && (
            <span className="ml-1 inline-block h-3.5 w-1.5 animate-pulse bg-amber-400" aria-hidden="true" />
          )}

          {isError && (
            <div className="mt-2 flex items-center gap-1 text-xs text-red-400">
              <AlertCircle className="h-3 w-3" aria-hidden="true" />
              <span>Error processing request</span>
            </div>
          )}
        </div>

        {/* Reasoning Panel */}
        {message.reasoning && !isUser && !isStreaming && (
          <div className="mt-1 w-full rounded-lg border border-border/50 bg-muted/20 p-3">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="gap-1 border-amber-500/20 bg-amber-500/5 text-[10px] text-amber-400">
                <Brain className="h-3 w-3" aria-hidden="true" />
                {message.reasoning.confidence}% confident
              </Badge>
              {message.reasoning && (
                <Badge
                  variant="outline"
                  className={cn("gap-1 text-[10px]", priorityConfig[message.reasoning.priority].color)}
                >
                  <Gauge className="h-3 w-3" aria-hidden="true" />
                  {priorityConfig[message.reasoning.priority].label}
                </Badge>
              )}
            </div>

            {message.reasoning.evidence.length > 0 && (
              <div className="mb-2">
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Evidence</p>
                <ul className="space-y-0.5">
                  {message.reasoning.evidence.map((ev, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
                      <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-emerald-400" aria-hidden="true" />
                      {ev}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex flex-wrap gap-3 text-[11px]">
              <div className="flex items-center gap-1 text-muted-foreground">
                <Target className="h-3 w-3 text-blue-400" aria-hidden="true" />
                <span className="font-medium text-foreground/80">Action:</span> {message.reasoning.recommendedAction}
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <ArrowRight className="h-3 w-3 text-green-400" aria-hidden="true" />
                <span className="font-medium text-foreground/80">Outcome:</span> {message.reasoning.expectedOutcome}
              </div>
            </div>

            {/* Alternatives */}
            {message.reasoning.alternatives && message.reasoning.alternatives.length > 0 && (
              <div className="mt-2 border-t border-border/50 pt-2">
                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Decision Options</p>
                <div className="grid gap-1.5 sm:grid-cols-2">
                  {message.reasoning.alternatives.map((alt, i) => (
                    <div
                      key={i}
                      className="rounded-md border border-border/50 bg-background p-2"
                    >
                      <p className="text-[11px] font-medium text-foreground">{alt.label}</p>
                      <p className="text-[10px] text-muted-foreground">{alt.action}</p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        <Badge variant="outline" className="text-[9px] px-1 py-0">
                          Cost: {alt.implementationCost}
                        </Badge>
                        <Badge variant="outline" className="text-[9px] px-1 py-0">
                          Risk: {alt.risk}
                        </Badge>
                        <Badge variant="outline" className="text-[9px] px-1 py-0">
                          {alt.implementationTime}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Suggestions */}
        {message.suggestions && message.suggestions.length > 0 && !isUser && !isStreaming && (
          <div className="mt-1 flex flex-wrap gap-1.5">
            {message.suggestions.map((suggestion, i) => (
              <Badge
                key={i}
                variant="secondary"
                className="cursor-pointer text-[10px] transition-colors hover:bg-accent"
                tabIndex={0}
                role="button"
                aria-label={`Suggested question: ${suggestion}`}
              >
                {suggestion}
              </Badge>
            ))}
          </div>
        )}

        <span className="px-1 text-[10px] text-muted-foreground">
          {new Date(message.timestamp).toLocaleTimeString()}
        </span>
      </div>
    </div>
  );
}
