import { Badge } from "@/components/ui/badge";
import { RISK_LEVEL_LABELS, RISK_LEVEL_TONES, type RiskLevel } from "@/apps/kyc/risk";

export function RiskBadge({ riskLevel }: { riskLevel: RiskLevel }) {
  return <Badge label={RISK_LEVEL_LABELS[riskLevel]} tone={RISK_LEVEL_TONES[riskLevel]} />;
}
