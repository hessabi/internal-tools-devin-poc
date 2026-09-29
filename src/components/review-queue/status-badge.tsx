import { Badge } from "@/components/ui/badge";
import { REVIEW_STATUS_LABELS, type ReviewStatus } from "@/lib/config/states";

export function StatusBadge({ status }: { status: ReviewStatus }) {
  return <Badge label={REVIEW_STATUS_LABELS[status]} />;
}
