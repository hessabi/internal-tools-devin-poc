import { z } from "zod";

export const REVIEW_STATUSES = [
  "pending",
  "in_review",
  "approved",
  "rejected",
] as const;
export const ReviewStatusSchema = z.enum(REVIEW_STATUSES);
export type ReviewStatus = z.infer<typeof ReviewStatusSchema>;
export const REVIEW_STATUS_LABELS: Record<ReviewStatus, string> = {
  pending: "Pending",
  in_review: "In review",
  approved: "Approved",
  rejected: "Rejected",
};

export const DECIDED_STATUSES: readonly ReviewStatus[] = ["approved", "rejected"];

export const AUDIT_ACTIONS = [
  "update",
  "start_review",
  "approve",
  "reject",
] as const;
export const AuditActionSchema = z.enum(AUDIT_ACTIONS);
export type AuditAction = z.infer<typeof AuditActionSchema>;
