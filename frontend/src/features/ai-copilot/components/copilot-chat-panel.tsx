"use client";

import { useRef, useEffect, type KeyboardEvent } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CopilotMessageView } from "./copilot-message";
import { Send, Sparkles, Loader2 } from "lucide-react";
import type { CopilotMessage } from "../types";

interface CopilotChatPanelProps {
  messages: CopilotMessage[];
  isProcessing: boolean;
  inputValue: string;
  onInputChange: (value: string) => void;
  onSend: () => void;
  className?: string;
}

export function CopilotChatPanel({
  messages,
  isProcessing,
  inputValue,
  onInputChange,
  onSend,
  className,
}: CopilotChatPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className={cn("flex h-full flex-col rounded-xl border bg-card", className)} role="region" aria-label="AI Copilot Chat">
      {/* Header */}
      <div className="flex shrink-0 items-center gap-2 border-b px-4 py-3">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/20">
          <Sparkles className="h-3.5 w-3.5 text-amber-400" aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-foreground">AI Copilot</h2>
          <p className="text-[10px] text-muted-foreground">Autonomous Operations Assistant</p>
        </div>
        {isProcessing && (
          <div className="ml-auto flex items-center gap-1.5 text-xs text-amber-400">
            <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
            Analyzing...
          </div>
        )}
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 space-y-4 overflow-y-auto p-4 scrollbar-thin"
        role="log"
        aria-live="polite"
        aria-label="Conversation history"
      >
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <Sparkles className="mb-2 h-8 w-8 text-amber-400/50" aria-hidden="true" />
            <p className="text-sm font-medium text-foreground/80">AI Copilot Ready</p>
            <p className="mt-1 max-w-xs text-xs text-muted-foreground">
              Ask about stadium operations, risks, recommendations, or anything related to event management.
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <CopilotMessageView key={msg.id} message={msg} />
          ))
        )}
      </div>

      {/* Input */}
      <div className="shrink-0 border-t p-3">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about stadium operations..."
            disabled={isProcessing}
            className="h-9 text-sm"
            aria-label="Ask the AI copilot about stadium operations"
          />
          <Button
            size="sm"
            onClick={onSend}
            disabled={isProcessing || !inputValue.trim()}
            className="h-9 px-3"
            aria-label="Send message"
          >
            {isProcessing ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Send className="h-4 w-4" aria-hidden="true" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
