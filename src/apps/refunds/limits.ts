import { formatMoney } from "@/lib/format";
import type { Refund } from "@/apps/refunds/types";

export const REFUND_CURRENCY = "USD";

export const REFUND_MANAGER_THRESHOLD_CENTS = 500_00;

export const AMOUNT_BANDS = ["up_to_threshold", "over_threshold"] as const;
export type AmountBand = (typeof AMOUNT_BANDS)[number];

const thresholdLabel = formatMoney(REFUND_MANAGER_THRESHOLD_CENTS, REFUND_CURRENCY);

export const AMOUNT_BAND_LABELS: Record<AmountBand, string> = {
  up_to_threshold: `${thresholdLabel} or less`,
  over_threshold: `Over ${thresholdLabel}`,
};

export function needsManager(refund: Pick<Refund, "amountCents">): boolean {
  return refund.amountCents > REFUND_MANAGER_THRESHOLD_CENTS;
}

export function amountBandOf(refund: Pick<Refund, "amountCents">): AmountBand {
  return needsManager(refund) ? "over_threshold" : "up_to_threshold";
}
