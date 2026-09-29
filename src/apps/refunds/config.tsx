import { StatusBadge } from "@/components/review-queue/status-badge";
import { Badge } from "@/components/ui/badge";
import { defineReviewQueue } from "@/lib/review-queue/define";
import { assignToActor, notAssignee } from "@/lib/review-queue/transitions";
import type { ReviewQueueConfig } from "@/lib/review-queue/types";
import { ROLES } from "@/lib/config/roles";
import {
  DECIDED_STATUSES,
  REVIEW_STATUSES,
  REVIEW_STATUS_LABELS,
} from "@/lib/config/states";
import { formatMoney, formatUtc } from "@/lib/format";
import {
  AMOUNT_BANDS,
  AMOUNT_BAND_LABELS,
  amountBandOf,
  needsManager,
} from "@/apps/refunds/limits";
import { REFUND_REASONS, REFUND_REASON_LABELS } from "@/apps/refunds/reasons";
import { refundRepository } from "@/apps/refunds/repository";
import type { Refund } from "@/apps/refunds/types";

const allRoles = (): typeof ROLES => ROLES;
const decisionRoles = (item: Refund): readonly (typeof ROLES)[number][] =>
  needsManager(item) ? ["manager", "admin"] : ROLES;

const amount = (item: Refund): string => formatMoney(item.amountCents, item.currency);

export const refundsQueue: ReviewQueueConfig<Refund> = defineReviewQueue({
  key: "refunds",
  title: "Refunds dashboard",
  description: "Review synthetic refund requests and record payout decisions.",
  basePath: "/refunds",
  entityType: "refund",
  readRoles: ROLES,
  transitions: [
    {
      action: "start_review",
      label: "Start review",
      successMessage: "Review started. The refund is assigned to you.",
      from: ["pending"],
      to: "in_review",
      requireComment: false,
      allowedRoles: allRoles,
      onApply: assignToActor,
    },
    {
      action: "approve",
      label: "Approve",
      successMessage: "Refund approved for payout.",
      from: ["in_review"],
      to: "approved",
      requireComment: false,
      allowedRoles: decisionRoles,
      guard: notAssignee,
    },
    {
      action: "reject",
      label: "Reject",
      successMessage: "Refund rejected.",
      from: ["in_review"],
      to: "rejected",
      requireComment: true,
      allowedRoles: decisionRoles,
      guard: notAssignee,
    },
  ],
  filters: [
    {
      key: "status",
      label: "Status",
      options: REVIEW_STATUSES.map((value) => ({
        value,
        label: REVIEW_STATUS_LABELS[value],
      })),
    },
    {
      key: "amountBand",
      label: "Amount",
      options: AMOUNT_BANDS.map((value) => ({ value, label: AMOUNT_BAND_LABELS[value] })),
    },
    {
      key: "reason",
      label: "Reason",
      options: REFUND_REASONS.map((value) => ({ value, label: REFUND_REASON_LABELS[value] })),
    },
  ],
  listColumns: [
    { key: "refundLabel", label: "Refund", render: (item) => item.refundLabel },
    { key: "customerLabel", label: "Customer", render: (item) => item.customerLabel },
    { key: "amount", label: "Amount", render: amount },
    { key: "reason", label: "Reason", render: (item) => REFUND_REASON_LABELS[item.reason] },
    { key: "status", label: "Status", render: (item) => <StatusBadge status={item.status} /> },
    { key: "assignee", label: "Assignee", render: (item) => item.assignee?.name ?? "Unassigned" },
    { key: "submittedAt", label: "Submitted", render: (item) => formatUtc(item.submittedAt) },
  ],
  detailFields: [
    { key: "refundLabel", label: "Refund", render: (item) => item.refundLabel },
    { key: "customerLabel", label: "Customer", render: (item) => item.customerLabel },
    { key: "orderReference", label: "Order reference", render: (item) => item.orderReference },
    { key: "amount", label: "Amount", render: amount },
    {
      key: "amountBand",
      label: "Approval level",
      render: (item) => <Badge variant="outline">{AMOUNT_BAND_LABELS[amountBandOf(item)]}</Badge>,
    },
    { key: "reason", label: "Reason", render: (item) => REFUND_REASON_LABELS[item.reason] },
    { key: "status", label: "Status", render: (item) => <StatusBadge status={item.status} /> },
    { key: "assignee", label: "Assignee", render: (item) => item.assignee?.name ?? "Unassigned" },
    { key: "submittedAt", label: "Submitted", render: (item) => formatUtc(item.submittedAt) },
  ],
  notesLockedStatuses: DECIDED_STATUSES,
  repository: refundRepository,
});
