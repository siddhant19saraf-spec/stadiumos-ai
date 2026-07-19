"use client";

import { useState, useEffect, useCallback } from "react";
import { Shell } from "@/components/layout/shell";
import { ErrorBoundary } from "@/components/error-boundary";
import { LoadingPage } from "@/components/loading";
import { CopilotChatPanel } from "@/features/ai-copilot/components/copilot-chat-panel";
import { CopilotSuggestedActions } from "@/features/ai-copilot/components/copilot-suggested-actions";
import type { SuggestedAction } from "@/features/ai-copilot/components/copilot-suggested-actions";
import { CopilotOperationalSummary } from "@/features/ai-copilot/components/copilot-operational-summary";
import { CopilotActiveRisks } from "@/features/ai-copilot/components/copilot-active-risks";
import { CopilotPredictedProblems } from "@/features/ai-copilot/components/copilot-predicted-problems";
import { CopilotRecommendedDecisions } from "@/features/ai-copilot/components/copilot-recommended-decisions";
import { CopilotDecisionComparison } from "@/features/ai-copilot/components/copilot-decision-comparison";
import { CopilotActionConfirmation } from "@/features/ai-copilot/components/copilot-action-confirmation";
import { CopilotExplainabilityPanel } from "@/features/ai-copilot/components/copilot-explainability-panel";
import { aiCopilotService } from "@/features/ai-copilot/services/ai-copilot-service";
import type {
  CopilotMessage,
  ActiveRisk,
  PredictedProblem,
  OperationalSummary,
  ActionExecution,
  DecisionOption,
  AIReasoning,
  OperationalContext,
  RecommendedDecision,
} from "@/features/ai-copilot/types";
import { toast } from "@/hooks/use-toast";

export default function AICopilotPage() {
  const [messages, setMessages] = useState<CopilotMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [operationalSummary, setOperationalSummary] = useState<OperationalSummary | null>(null);
  const [activeRisks, setActiveRisks] = useState<ActiveRisk[]>([]);
  const [predictedProblems, setPredictedProblems] = useState<PredictedProblem[]>([]);
  const [context, setContext] = useState<OperationalContext | null>(null);
  const [pendingExecution, setPendingExecution] = useState<{
    option: DecisionOption;
  } | null>(null);
  const [executionResult, setExecutionResult] = useState<ActionExecution | null>(null);
  const [decisions, _setDecisions] = useState<RecommendedDecision[]>([]);
  const [comparisonData, setComparisonData] = useState<{
    title: string;
    options: DecisionOption[];
  } | null>(null);
  const [selectedReasoning, setSelectedReasoning] = useState<AIReasoning | null>(null);

  useEffect(() => {
    async function initialize() {
      try {
        const { message, summary, risks, problems, context: ctx } =
          await aiCopilotService.getInitialAnalysis();
        setMessages([message]);
        setOperationalSummary(summary);
        setActiveRisks(risks);
        setPredictedProblems(problems);
        setContext(ctx);
      } catch (error) {
        toast({ title: "Copilot initialization failed", description: error instanceof Error ? error.message : "Unable to load AI Copilot", variant: "destructive" });
        setMessages([
          {
            id: "welcome",
            role: "assistant",
            content:
              "Welcome to the AI Stadium Copilot. I'm ready to assist with smart stadium operations. Ask me anything about crowd management, parking, tournament scheduling, security, or any stadium operational domain.",
            timestamp: new Date().toISOString(),
            status: "complete",
            suggestions: [
              "What should I do right now?",
              "Show active risks",
              "Summarize today's operations",
            ],
          },
        ]);
      } finally {
        setIsInitializing(false);
      }
    }
    initialize();
  }, []);

  const handleSendMessage = useCallback(async () => {
    const query = inputValue.trim();
    if (!query || isProcessing || !context) return;

    setInputValue("");
    setIsProcessing(true);

    try {
      await aiCopilotService.sendMessage(messages, context, query, (updated) => {
        setMessages((prev) => {
          const exists = prev.find((m) => m.id === updated.id);
          if (exists) {
            return prev.map((m) => (m.id === updated.id ? updated : m));
          }
          return [...prev, updated];
        });
      });

      const freshContext = await aiCopilotService.refreshContext();
      setContext(freshContext);
    } catch (error) {
      toast({ title: "Failed to send message", description: error instanceof Error ? error.message : "Unable to process your request", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  }, [inputValue, isProcessing, messages, context]);

  const handleSuggestedAction = useCallback(
    async (action: SuggestedAction) => {
      const queryMap: Record<string, string> = {
        risks: "What are the current active risks and how should I respond?",
        parking: "Show me the parking status and any overflow risks",
        queue: "Analyze current queue times and predict upcoming bottlenecks",
        crowd: "Show crowd movement analysis and pinch points",
        staff: "Optimize staff allocation based on current demand",
        energy: "Review energy consumption and suggest optimizations",
      };
      const query = queryMap[action.id] ?? `Analyze ${action.label}`;
      setInputValue(query);
    },
    [],
  );

  const handleRiskSelect = useCallback((risk: ActiveRisk) => {
    setInputValue(`Tell me more about "${risk.title}" and what actions I should take.`);
  }, []);

  const handleProblemAction = useCallback(async (_problem: PredictedProblem) => {
    setInputValue(`How should I address the predicted problem?`);
  }, []);

  const handleProblemQuery = useCallback((problem: PredictedProblem) => {
    setInputValue(`Explain the "${problem.title}" situation in detail.`);
  }, []);

  const handleDecisionApply = useCallback(
    async (decision: import("@/features/ai-copilot/types").RecommendedDecision) => {
      if (decision.options.length > 1) {
        setComparisonData({ title: decision.title, options: decision.options });
      } else {
        setPendingExecution({ option: decision.options[0]! });
      }
    },
    [],
  );

  const handleDecisionCompare = useCallback(
    (decision: import("@/features/ai-copilot/types").RecommendedDecision) => {
      setComparisonData({ title: decision.title, options: decision.options });
    },
    [],
  );

  const handleComparisonSelect = useCallback((option: DecisionOption) => {
    setComparisonData(null);
    setPendingExecution({ option });
  }, []);

  const handleConfirmAction = useCallback(async () => {
    if (!pendingExecution || !context) return;
    const result = await aiCopilotService.executeAction(
      pendingExecution.option.action,
      context,
    );
    setExecutionResult(result);

    if (result.status === "completed") {
      setMessages((prev) => [
        ...prev,
        {
          id: `action-${Date.now()}`,
          role: "assistant",
          content: `✅ Action executed: ${pendingExecution.option.action}\n\nResult: ${result.result}`,
          timestamp: new Date().toISOString(),
          status: "complete",
        },
      ]);
    }

    setTimeout(() => {
      setPendingExecution(null);
      setExecutionResult(null);
    }, 3000);
  }, [pendingExecution, context]);

  const handleCancelAction = useCallback(() => {
    setPendingExecution(null);
    setExecutionResult(null);
  }, []);

  if (isInitializing) {
    return (
      <Shell title="AI Stadium Copilot">
        <LoadingPage message="Initializing AI Stadium Copilot..." />
      </Shell>
    );
  }

  return (
    <Shell title="AI Stadium Copilot">
      <ErrorBoundary module="AI Stadium Copilot">
        <div className="flex h-[calc(100vh-8rem)] gap-4">
          {/* Left Panel: Chat */}
          <div className="flex w-full flex-col lg:w-[45%] xl:w-[40%]">
            <CopilotChatPanel
              messages={messages}
              isProcessing={isProcessing}
              inputValue={inputValue}
              onInputChange={setInputValue}
              onSend={handleSendMessage}
              className="h-full"
            />
          </div>

          {/* Right Panel: Intelligence & Actions */}
          <div className="hidden flex-1 flex-col gap-4 overflow-y-auto lg:flex scrollbar-thin">
            {/* Operational Summary */}
            {operationalSummary && (
              <CopilotOperationalSummary summary={operationalSummary} />
            )}

            {/* Suggested Actions */}
            <CopilotSuggestedActions actions={[]} onSelect={handleSuggestedAction} />

            {/* Two-column grid for risks and problems */}
            <div className="grid grid-cols-2 gap-4">
              <CopilotActiveRisks
                risks={activeRisks}
                onSelect={handleRiskSelect}
              />
              <CopilotPredictedProblems
                problems={predictedProblems}
                onAction={handleProblemAction}
                onQuery={handleProblemQuery}
              />
            </div>

            {/* Recommended Decisions */}
            <CopilotRecommendedDecisions
              decisions={decisions}
              onApply={handleDecisionApply}
              onCompare={handleDecisionCompare}
            />
          </div>
        </div>

        {/* Modals / Overlays */}
        {comparisonData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-2xl">
              <CopilotDecisionComparison
                title={comparisonData.title}
                options={comparisonData.options}
                onSelect={handleComparisonSelect}
                onClose={() => setComparisonData(null)}
              />
            </div>
          </div>
        )}

        {pendingExecution && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md">
              <CopilotActionConfirmation
                option={pendingExecution.option}
                onConfirm={handleConfirmAction}
                onCancel={handleCancelAction}
                execution={executionResult ?? undefined}
              />
            </div>
          </div>
        )}

        {selectedReasoning && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setSelectedReasoning(null)}
          >
            <div
              className="w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <CopilotExplainabilityPanel reasoning={selectedReasoning} />
            </div>
          </div>
        )}
      </ErrorBoundary>
    </Shell>
  );
}
