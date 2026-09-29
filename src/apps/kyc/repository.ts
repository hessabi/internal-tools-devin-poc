import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { ReviewStatusSchema } from "@/lib/config/states";
import { RiskLevelSchema } from "@/apps/kyc/risk";
import type { KycCase } from "@/apps/kyc/types";
import type { QueueRepository } from "@/lib/review-queue/types";

const include = {
  assignee: { select: { id: true, name: true, role: true } },
} satisfies Prisma.KycCaseInclude;

function toKycCase(item: Prisma.KycCaseGetPayload<{ include: typeof include }>): KycCase {
  const status = ReviewStatusSchema.safeParse(item.status);
  const riskLevel = RiskLevelSchema.safeParse(item.riskLevel);
  if (!status.success || !riskLevel.success) {
    throw new AppError("VALIDATION", "KYC case contains an invalid state");
  }
  return {
    ...item,
    status: status.data,
    riskLevel: riskLevel.data,
  };
}

export const kycRepository: QueueRepository<KycCase> = {
  async list({ filters, page, pageSize }) {
    const where: Prisma.KycCaseWhereInput = {
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.riskLevel ? { riskLevel: filters.riskLevel } : {}),
      ...(filters.country ? { country: filters.country } : {}),
    };
    const [items, total] = await Promise.all([
      prisma.kycCase.findMany({
        where,
        include,
        orderBy: { submittedAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.kycCase.count({ where }),
    ]);
    return { items: items.map(toKycCase), total };
  },
  async findById(id) {
    const item = await prisma.kycCase.findUnique({ where: { id }, include });
    return item ? toKycCase(item) : null;
  },
  async update(tx, id, data) {
    const item = await tx.kycCase.update({
      where: { id },
      data: data as Prisma.KycCaseUpdateInput,
      include,
    });
    return toKycCase(item);
  },
};

export function countryOptions(): { value: string; label: string }[] {
  return ["AQ", "BV", "CX", "EH", "UM"].map((country) => ({
    value: country,
    label: country,
  }));
}
