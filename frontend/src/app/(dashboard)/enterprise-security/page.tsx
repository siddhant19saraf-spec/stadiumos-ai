import { Shell } from "@/components/layout/shell";
import { ErrorBoundary } from "@/components/error-boundary";
import { SecurityDashboard } from "@/features/enterprise-security/components/security-dashboard";

export default function EnterpriseSecurityPage() {
  return (
    <Shell title="Stadium Security Operations">
      <ErrorBoundary module="Stadium Security Operations">
        <SecurityDashboard />
      </ErrorBoundary>
    </Shell>
  );
}
