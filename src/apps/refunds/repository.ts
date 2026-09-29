import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { ReviewStatusSchema } from "@/lib/config/states";
import type { QueueRepository } from "@/lib/review-queue/types";
import { REFUND_MANAGER_THRESHOLD_CENTS, type AmountBand } from "@/apps/refunds/limits";
import { RefundReasonSchema } from "@/apps/refunds/reasons";
import type { Refund } from "@/apps/refunds/types";

const include = {
  assignee: { select: { id: true, name: true, role: true } },
} satisfies Prisma.RefundInclude;

function toRefund(item: Prisma.RefundGetPayload<{ include: typeof include }>): Refund {
  const status = ReviewStatusSchema.safeParse(item.status);
  const reason = RefundReasonSchema.safeParse(item.reason);
  if (!status.success || !reason.success) {
    throw new AppError("VALIDATION", "Refund contains an invalid state");
  }
  return { ...item, status: status.data, reason: reason.data };
}

const amountBandWhere: Record<AmountBand, Prisma.IntFilter> = {
  up_to_threshold: { lte: REFUND_MANAGER_THRESHOLD_CENTS },
  over_threshold: { gt: REFUND_MANAGER_THRESHOLD_CENTS },
};

function amountFilter(band: string | undefined): Prisma.RefundWhereInput {
  if (band === "up_to_threshold" || band === "over_threshold") {
    return { amountCents: amountBandWhere[band] };
  }
  return {};
}

export const refundRepository: QueueRepository<Refund> = {
  async list({ filters, page, pageSize }) {
    const where: Prisma.RefundWhereInput = {
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.reason ? { reason: filters.reason } : {}),
      ...amountFilter(filters.amountBand),
    };
    const [items, total] = await Promise.all([
      prisma.refund.findMany({
        where,
        include,
        orderBy: { submittedAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.refund.count({ where }),
    ]);
    return { items: items.map(toRefund), total };
  },
  async findById(id) {
    const item = await prisma.refund.findUnique({ where: { id }, include });
    return item ? toRefund(item) : null;
  },
  async update(tx, id, data) {
    const item = await tx.refund.update({
      where: { id },
      data: data as Prisma.RefundUpdateInput,
      include,
    });
    return toRefund(item);
  },
};
