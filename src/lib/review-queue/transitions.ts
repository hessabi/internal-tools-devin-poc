import type { AppErrorCode } from "@/lib/errors";
import type { Session } from "@/lib/auth/provider";
import type { ReviewItem } from "@/lib/review-queue/types";

export function notAssignee(
  item: ReviewItem,
  actor: Session,
): AppErrorCode | null {
  return item.assigneeId === actor.userId ? "SELF_APPROVAL" : null;
}

export function assignToActor(
  _item: ReviewItem,
  actor: Session,
): Partial<ReviewItem> {
  return { assigneeId: actor.userId };
}
