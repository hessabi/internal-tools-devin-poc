import type { AppErrorCode } from "@/lib/errors";
import type { Session } from "@/lib/auth/provider";
import type { ReviewItem } from "@/lib/review-queue/types";

export function notAssignee(
  item: ReviewItem,
  actor: Session,
): AppErrorCode | null {
  return item.assigneeId === actor.userId ? "SELF_APPROVAL" : null;
}

export function assignToActor<Item extends ReviewItem>(
  _item: Item,
  actor: Session,
): Partial<Item> {
  return { assigneeId: actor.userId } as Partial<Item>;
}
