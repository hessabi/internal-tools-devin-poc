import { Badge } from "@/components/ui/badge";
import { defineReviewQueue } from "@/lib/review-queue/define";
import { assignToActor, notAssignee } from "@/lib/review-queue/transitions";
import type { ReviewQueueConfig } from "@/lib/review-queue/types";
import { ROLES } from "@/lib/config/roles";
import {
  REVIEW_STATUSES,
  REVIEW_STATUS_LABELS,
} from "@/lib/config/states";
import { formatUtc } from "@/lib/format";
import { countryOptions, kycRepository } from "@/apps/kyc/repository";
import type { KycCase } from "@/apps/kyc/types";
import { RISK_LEVELS } from "@/apps/kyc/risk";

const allRoles = (): typeof ROLES => ROLES;
const approvalRoles = (item: KycCase): readonly (typeof ROLES)[number][] =>
  item.riskLevel === "high" ? ["manager", "admin"] : ROLES;

export const kycQueue: ReviewQueueConfig<KycCase> = defineReviewQueue({
  key: "kyc",
  title: "KYC review queue",
  description: "Review synthetic customer cases and record decisions.",
  basePath: "/kyc",
  entityType: "kyc_case",
  readRoles: ROLES,
  transitions: [
    {
      action: "start_review",
      label: "Start review",
      from: ["pending"],
      to: "in_review",
      requireComment: false,
      allowedRoles: allRoles,
      onApply: assignToActor,
    },
    {
      action: "approve",
      label: "Approve",
      from: ["in_review"],
      to: "approved",
      requireComment: false,
      allowedRoles: approvalRoles,
      guard: notAssignee,
    },
    {
      action: "reject",
      label: "Reject",
      from: ["in_review"],
      to: "rejected",
      requireComment: true,
      allowedRoles: approvalRoles,
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
      key: "riskLevel",
      label: "Risk",
      options: RISK_LEVELS.map((value) => ({ value, label: value })),
    },
    { key: "country", label: "Country", options: countryOptions() },
  ],
  listColumns: [
    { key: "customerLabel", label: "Customer", render: (item) => item.customerLabel },
    { key: "country", label: "Country", render: (item) => item.country },
    { key: "riskLevel", label: "Risk", render: (item) => <Badge value={item.riskLevel} /> },
    { key: "status", label: "Status", render: (item) => <Badge value={item.status} /> },
    { key: "assignee", label: "Assignee", render: (item) => item.assignee?.name ?? "Unassigned" },
    { key: "submittedAt", label: "Submitted", render: (item) => formatUtc(item.submittedAt) },
  ],
  detailFields: [
    { key: "customerLabel", label: "Customer", render: (item) => item.customerLabel },
    { key: "customerEmail", label: "Customer email", render: (item) => item.customerEmail },
    { key: "country", label: "Country", render: (item) => item.country },
    { key: "riskLevel", label: "Risk", render: (item) => <Badge value={item.riskLevel} /> },
    { key: "status", label: "Status", render: (item) => <Badge value={item.status} /> },
    { key: "assignee", label: "Assignee", render: (item) => item.assignee?.name ?? "Unassigned" },
    { key: "submittedAt", label: "Submitted", render: (item) => formatUtc(item.submittedAt) },
  ],
  editableNotesField: "notes",
  repository: kycRepository,
});
