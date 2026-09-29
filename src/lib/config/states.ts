import { z } from "zod";

export const REVIEW_STATUSES = [
  "pending",
  "in_review",
  "approved",
  "rejected",
] as const;
export const ReviewStatusSchema = z.enum(REVIEW_STATUSES);
export type ReviewStatus = z.infer<typeof ReviewStatusSchema>;

export const AUDIT_ACTIONS = [
  "create",
  "update",
  "start_review",
  "approve",
  "reject",
  "sign_in",
  "sign_out",
] as const;
export const AuditActionSchema = z.enum(AUDIT_ACTIONS);
export type AuditAction = z.infer<typeof AuditActionSchema>;
