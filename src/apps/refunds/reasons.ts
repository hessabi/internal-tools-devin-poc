import { z } from "zod";

export const REFUND_REASONS = [
  "damaged_item",
  "not_received",
  "duplicate_charge",
  "service_issue",
  "other",
] as const;
export const RefundReasonSchema = z.enum(REFUND_REASONS);
export type RefundReason = z.infer<typeof RefundReasonSchema>;
export const REFUND_REASON_LABELS: Record<RefundReason, string> = {
  damaged_item: "Damaged item",
  not_received: "Not received",
  duplicate_charge: "Duplicate charge",
  service_issue: "Service issue",
  other: "Other",
};
