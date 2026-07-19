// @ts-nocheck
"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle2, Loader2, XCircle, ArrowRight, Clock, Target } from "lucide-react";
import type { ActionExecution, DecisionOption } from "../types";

interface CopilotActionConfirmationProps {
  option: DecisionOption;
  onConfirm: () => void;
  onCancel: () => void;
  execution?: ActionExecution;
  className?: string;
}

export function CopilotActionConfirmation({
  option,
  onConfirm,
  onCancel,
  execution,
  className,
}: CopilotActionConfirmationProps) {
  const [isExecuting, setIsExecuting] = useState(false);

  const handleConfirm = () => {
    setIsExecuting(true);
    onConfirm();
  };

  const isComplete = execution?.status === "completed" || execution?.status === "failed";

  return (
    <Card className={cn("border-amber-500/20 bg-amber-500/[0.02]", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          {execution?.status === "completed" ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-400" aria-hidden="true" />
          ) : isExecuting ? (
            <Loader2 className="h-4 w-4 animate-spin text-amber-400" aria-hidden="true" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-amber-400" aria-hidden="true" />
          )}
          <CardTitle className="text-sm font-medium">
            {execution?.status === "completed"
              ? "Action Executed"
              : isExecuting
                ? "Executing..."
                : "Confirm Action"}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {isComplete ? (
          <div>
            <p className="mb-2 text-sm text-foreground">{execution?.result ?? "Action completed successfully."}</p>
            <Badge className={cn("text-xs", execution?.status === "completed" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400")}>
              {execution?.status === "completed" ? "Completed" : "Failed"}
            </Badge>
          </div>
        ) : (
          <div>
            <p className="mb-2 text-sm font-medium text-foreground">{option.label}</p>
            <p className="mb-3 text-xs text-muted-foreground">{option.action}</p>

            <div className="mb-3 flex flex-wrap gap-2">
              <Badge variant="outline" className="gap-1 text-[10px]">
                <Target className="h-3 w-3" aria-hidden="true" />
                {option.expectedReduction}
              </Badge>
              <Badge variant="outline" className="gap-1 text-[10px]">
                <Clock className="h-3 w-3" aria-hidden="true" />
                {option.implementationTime}
              </Badge>
              <Badge variant="outline" className="text-[10px]">
                Cost: {option.implementationCost}
              </Badge>
              <Badge variant="outline" className="text-[10px]">
                Risk: {option.risk}
              </Badge>
            </div>

            <div className="flex gap-2">
              {!isExecuting && (
                <>
                  <Button size="sm" variant="default" onClick={handleConfirm} className="gap-1 text-xs" aria-label="Confirm and execute action">
                    <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                    Confirm & Execute
                  </Button>
                  <Button size="sm" variant="outline" onClick={onCancel} className="gap-1 text-xs" aria-label="Cancel action">
                    <XCircle className="h-3.5 w-3.5" aria-hidden="true" />
                    Cancel
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

