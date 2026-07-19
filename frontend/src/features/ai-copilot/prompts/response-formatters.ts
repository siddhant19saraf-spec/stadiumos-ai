import type { CopilotMessage, AIReasoning, DecisionOption } from "../types";

export function formatAIResponse(raw: string): Omit<CopilotMessage, "id" | "timestamp" | "status"> {
  const reasoning = extractReasoning(raw);
  return {
    role: "assistant",
    content: reasoning?.summary ?? raw,
    reasoning: reasoning ?? undefined,
    suggestions: extractSuggestions(raw),
  };
}

function extractReasoning(raw: string): AIReasoning | null {
  const summary = extractSection(raw, "Summary", "Reasoning") ?? raw.slice(0, 200);
  const reasoningText = extractSection(raw, "Reasoning", "Evidence");
  const evidenceText = extractSection(raw, "Evidence", "Confidence");
  const confidenceStr = extractValue(raw, "Confidence");
  const priorityStr = extractValue(raw, "Priority");
  const actionText = extractSection(raw, "Recommended Action", "Expected Outcome");
  const outcomeText = extractValue(raw, "Expected Outcome");

  const evidence = evidenceText
    ? evidenceText.split("\n").map((l) => l.replace(/^[-•*]\s*/, "").trim()).filter(Boolean)
    : [];

  const confidence = confidenceStr ? parseInt(confidenceStr.replace(/\D/g, ""), 10) : 85;
  const priority = validatePriority(extractValue(raw, "Priority"));

  const alternatives = extractAlternatives(raw);

  return {
    summary: summary.trim(),
    evidence: evidence.length > 0 ? evidence : ["Data analysis complete"],
    confidence: isNaN(confidence) ? 85 : Math.min(100, Math.max(0, confidence)),
    priority,
    recommendedAction: (actionText ?? "Continue monitoring").trim(),
    expectedOutcome: (outcomeText ?? "Operations maintained within normal parameters").trim(),
    alternatives: alternatives.length > 0 ? alternatives : undefined,
  };
}

function extractSection(text: string, start: string, end: string): string | null {
  const regex = new RegExp(
    `(?:\\*\\*)?${start}(?:\\*\\*)?[：
:](.*?)(?:\\n(?:\\*\\*)?${end}(?:\\*\\*)?[：:]|$)`,
    "is",
  );
  const match = text.match(regex);
  return match ? match[1]?.trim() ?? null : null;
}

function extractValue(text: string, label: string): string {
  const regex = new RegExp(
    `(?:\\*\\*)?${label}(?:\\*\\*)?[：
:]\\s*(.+?)(?:\\n|$)`,
    "i",
  );
  const match = text.match(regex);
  return match ? match[1]?.trim() ?? "" : "";
}

function validatePriority(value: string | null): AIReasoning["priority"] {
  const valid: AIReasoning["priority"][] = ["critical", "high", "medium", "low"];
  const lower = value?.toLowerCase().trim() ?? "";
  if (valid.includes(lower as AIReasoning["priority"])) {
    return lower as AIReasoning["priority"];
  }
  return "medium";
}

function extractSuggestions(text: string): string[] {
  const suggestions: string[] = [];
  const lines = text.split("\n");
  let inSuggestions = false;

  for (const line of lines) {
    if (/suggested (actions|questions)|you can (ask|try)|consider/i.test(line)) {
      inSuggestions = true;
      continue;
    }
    if (inSuggestions && /^\d+[.)]/.test(line.trim())) {
      suggestions.push(line.trim().replace(/^\d+[.)]\s*/, ""));
    }
    if (inSuggestions && suggestions.length > 0 && !line.trim()) {
      break;
    }
  }

  return suggestions.length > 0 ? suggestions.slice(0, 4) : [];
}

function extractAlternatives(text: string): DecisionOption[] {
  const options: DecisionOption[] = [];
  const sections = text.split(/(?:Option|Alternative)\s+[A-Z]/i);

  if (sections.length <= 1) return options;

  for (const section of sections.slice(1)) {
    const label = section.match(/^[:\s]*([^\n]+)/)?.[1]?.trim();
    if (!label) continue;

    options.push({
      label: label.slice(0, 40),
      action: extractValue(section, "Action") || label.slice(0, 40),
      implementationCost: (extractValue(section, "Cost").toLowerCase() as DecisionOption["implementationCost"]) || "medium",
      risk: (extractValue(section, "Risk").toLowerCase() as DecisionOption["risk"]) || "medium",
      implementationTime: extractValue(section, "Time") || extractValue(section, "Duration") || "TBD",
      confidence: parseInt(extractValue(section, "Confidence").replace(/\D/g, ""), 10) || 75,
    });
  }

  return options;
}
