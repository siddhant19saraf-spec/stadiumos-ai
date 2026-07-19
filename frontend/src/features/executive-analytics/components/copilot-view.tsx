"use client";

import { useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Brain, Send } from "lucide-react";
import type { ExecutiveAnalyticsData, CopilotQueryResult } from "../types";

export function CopilotView({ state, input, onInputChange, onSubmit, result, suggestedQuestions }: {
  state: ExecutiveAnalyticsData;
  input: string;
  onInputChange: (v: string) => void;
  onSubmit: () => void;
  result: CopilotQueryResult | null;
  suggestedQuestions: string[];
}) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [state.copilotHistory]);

  return (
    <div className="space-y-3">
      <Card className="border-primary/10">
        <CardContent className="p-4">
          <div className="mb-3 flex h-[400px] flex-col overflow-y-auto space-y-3">
            {state.copilotHistory.length === 0 && (
              <div className="flex flex-1 items-center justify-center">
                <div className="text-center">
                  <Brain className="mx-auto h-8 w-8 text-primary/30" />
                  <p className="mt-2 text-xs text-muted-foreground">Ask the Executive AI Advisor about stadium operations</p>
                  <div className="mt-3 flex flex-wrap justify-center gap-1">
                    {suggestedQuestions.map((q, i) => (
                      <Button key={i} variant="outline" size="sm" className="h-6 text-[10px]" onClick={() => { onInputChange(q); }}>
                        {q}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {state.copilotHistory.map((msg) => (
              <div key={msg.id} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
                <div className={cn(
                  "max-w-[80%] rounded-md px-3 py-2",
                  msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted",
                )}>
                  <p className="text-[10px] whitespace-pre-wrap">{msg.content}</p>
                  {msg.role === "assistant" && msg.confidence && (
                    <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground">
                      <span>Confidence: {msg.confidence}%</span>
                      {msg.sources && <span>Sources: {msg.sources.join(", ")}</span>}
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          <div className="flex items-center gap-2 border-t pt-3">
            <Input
              value={input}
              onChange={(e) => onInputChange(e.target.value)}
              placeholder="Ask about stadium operations, risks, decisions..."
              className="h-8 text-[10px]"
              onKeyDown={(e) => e.key === "Enter" && onSubmit()}
              aria-label="Ask about stadium operations"
            />
            <Button size="sm" className="h-8 shrink-0" onClick={onSubmit} aria-label="Send message">
              <Send className="h-3 w-3" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {result && (
        <Card className="border-emerald-500/20 bg-emerald-500/[0.02]">
          <CardContent className="p-3">
            <h3 className="mb-2 text-xs font-medium text-card-foreground">AI Analysis Results</h3>
            <div className="space-y-2 text-[10px]">
              <div className="flex items-center gap-2">
                <Brain className="h-3 w-3 text-primary" />
                <span>Confidence: {result.confidence}%</span>
                <span className="text-muted-foreground">Sources: {result.sources.join(", ")}</span>
              </div>
              {result.dataPoints.length > 0 && (
                <div className="grid grid-cols-2 gap-1 sm:grid-cols-4">
                  {result.dataPoints.map((dp, i) => (
                    <div key={i} className="rounded-md bg-primary/5 p-1.5">
                      <p className="text-muted-foreground">{dp.label}</p>
                      <p className="font-medium tabular-nums">{dp.value}</p>
                    </div>
                  ))}
                </div>
              )}
              {result.riskFlags.length > 0 && (
                <div className="rounded-md bg-red-500/5 p-1.5">
                  <p className="font-medium text-red-400">Risk Flags</p>
                  {result.riskFlags.map((f, i) => (<p key={i}>• {f}</p>))}
                </div>
              )}
              {result.recommendations.length > 0 && (
                <div className="rounded-md bg-amber-500/5 p-1.5">
                  <p className="font-medium text-amber-400">Recommendations</p>
                  {result.recommendations.map((r, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span>{r.title}</span>
                      <span className="text-muted-foreground">({r.confidence}% confidence)</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
