import type { ReviewItem, ReviewQueueConfig } from "@/lib/review-queue/types";
import { kycQueue } from "@/apps/kyc/config";
import { refundsQueue } from "@/apps/refunds/config";

export type QueueSummary = Pick<
  ReviewQueueConfig<ReviewItem>,
  "key" | "title" | "description" | "basePath" | "entityType"
>;

export const reviewQueues: readonly QueueSummary[] = [kycQueue, refundsQueue];

export function queueForEntityType(entityType: string): QueueSummary | undefined {
  return reviewQueues.find((queue) => queue.entityType === entityType);
}
