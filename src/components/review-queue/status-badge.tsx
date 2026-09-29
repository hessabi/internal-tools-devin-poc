import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { REVIEW_STATUS_LABELS, type ReviewStatus } from "@/lib/config/states";

const STATUS_VARIANTS: Record<ReviewStatus, BadgeVariant> = {
  pending: "secondary",
  in_review: "info",
  approved: "success",
  rejected: "destructive",
};

export function StatusBadge({ status }: { status: ReviewStatus }) {
  return <Badge variant={STATUS_VARIANTS[status]}>{REVIEW_STATUS_LABELS[status]}</Badge>;
}
