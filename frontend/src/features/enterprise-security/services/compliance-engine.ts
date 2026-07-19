import type { ComplianceFrameworkStatus, ComplianceFramework, ComplianceRequirement } from "../types";
import { COMPLIANCE_FRAMEWORKS } from "../constants";

export interface IComplianceEngine {
  getAllFrameworks(): ComplianceFrameworkStatus[];
  getFramework(framework: ComplianceFramework): ComplianceFrameworkStatus | undefined;
  getOverallComplianceScore(): number;
  getFrameworkScores(): { framework: ComplianceFramework; label: string; score: number; status: string }[];
  getGaps(framework?: ComplianceFramework): string[];
  getRecommendations(framework?: ComplianceFramework): string[];
  assessControl(framework: ComplianceFramework, controlId: string, status: ComplianceRequirement["status"], score: number): ComplianceRequirement | null;
  getCompliantCount(): number;
  getNonCompliantCount(): number;
  getLastAssessmentDate(): string;
}

export class MockComplianceEngine implements IComplianceEngine {
  private frameworks: ComplianceFrameworkStatus[];

  constructor() {
    this.frameworks = COMPLIANCE_FRAMEWORKS.map((f) => ({
      ...f,
      requirements: f.requirements.map((r) => ({ ...r })),
    }));
  }

  getAllFrameworks(): ComplianceFrameworkStatus[] {
    return this.frameworks.map((f) => ({
      ...f,
      requirements: [...f.requirements],
    }));
  }

  getFramework(framework: ComplianceFramework): ComplianceFrameworkStatus | undefined {
    return this.frameworks.find((f) => f.framework === framework);
  }

  getOverallComplianceScore(): number {
    const scores = this.frameworks.map((f) => f.overallScore);
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  }

  getFrameworkScores(): { framework: ComplianceFramework; label: string; score: number; status: string }[] {
    return this.frameworks.map((f) => ({
      framework: f.framework,
      label: f.label,
      score: f.overallScore,
      status: f.overallScore >= 80 ? "compliant" : f.overallScore >= 60 ? "partial" : "non_compliant",
    }));
  }

  getGaps(framework?: ComplianceFramework): string[] {
    if (framework) {
      return this.frameworks.find((f) => f.framework === framework)?.gaps ?? [];
    }
    return this.frameworks.flatMap((f) => f.gaps);
  }

  getRecommendations(framework?: ComplianceFramework): string[] {
    if (framework) {
      return this.frameworks.find((f) => f.framework === framework)?.recommendations ?? [];
    }
    return this.frameworks.flatMap((f) => f.recommendations);
  }

  assessControl(framework: ComplianceFramework, controlId: string, status: ComplianceRequirement["status"], score: number): ComplianceRequirement | null {
    const fw = this.frameworks.find((f) => f.framework === framework);
    if (!fw) return null;
    const req = fw.requirements.find((r) => r.controlId === controlId);
    if (!req) return null;
    req.status = status;
    req.score = score;
    req.lastAssessed = new Date().toISOString();
    // Recalculate overall score
    const compliant = fw.requirements.filter((r) => r.status === "compliant").length;
    fw.overallScore = Math.round((compliant / fw.requirements.length) * 100);
    fw.gaps = fw.requirements.filter((r) => r.status !== "compliant").map((r) => `${r.controlId}: ${r.title}`);
    fw.lastAssessment = new Date().toISOString();
    return req;
  }

  getCompliantCount(): number {
    return this.frameworks.reduce((sum, f) =>
      sum + f.requirements.filter((r) => r.status === "compliant").length, 0,
    );
  }

  getNonCompliantCount(): number {
    return this.frameworks.reduce((sum, f) =>
      sum + f.requirements.filter((r) => r.status === "non_compliant").length, 0,
    );
  }

  getLastAssessmentDate(): string {
    const dates = this.frameworks.map((f) => f.lastAssessment).sort();
    return dates[dates.length - 1] ?? new Date().toISOString();
  }
}

export const complianceEngine = new MockComplianceEngine();
