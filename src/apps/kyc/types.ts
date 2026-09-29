import type { ReviewStatus } from "@/lib/config/states";
import type { RiskLevel } from "@/apps/kyc/risk";

export type KycCase = {
  id: string;
  customerLabel: string;
  customerEmail: string;
  country: string;
  riskLevel: RiskLevel;
  status: ReviewStatus;
  assigneeId: string | null;
  assignee: { id: string; name: string; role: string } | null;
  notes: string;
  submittedAt: Date;
  createdAt: Date;
  updatedAt: Date;
};
