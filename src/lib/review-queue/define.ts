import type { ReviewItem, ReviewQueueConfig } from "@/lib/review-queue/types";

export function defineReviewQueue<Item extends ReviewItem>(
  config: ReviewQueueConfig<Item>,
): ReviewQueueConfig<Item> {
  return config;
}
