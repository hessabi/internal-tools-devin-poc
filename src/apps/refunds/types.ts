import type { ReviewStatus } from "@/lib/config/states";
import type { RefundReason } from "@/apps/refunds/reasons";

export type Refund = {
  id: string;
  refundLabel: string;
  customerLabel: string;
  orderReference: string;
  amountCents: number;
  currency: string;
  reason: RefundReason;
  status: ReviewStatus;
  assigneeId: string | null;
  assignee: { id: string; name: string; role: string } | null;
  submittedAt: Date;
  createdAt: Date;
  updatedAt: Date;
};
