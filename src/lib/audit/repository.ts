import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "@/lib/config/pagination";

export type AuditListParams = {
  page: number;
  pageSize?: number;
  entityType?: string;
  entityId?: string;
};

export type AuditListEntry = {
  id: string;
  actorId: string;
  actor: { name: string; role: string };
  action: string;
  entityType: string;
  entityId: string;
  changes: string;
  comment: string | null;
  createdAt: Date;
};

export type AuditListResult = {
  items: AuditListEntry[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
};

export async function listAuditEntries(
  params: AuditListParams,
  tx: Prisma.TransactionClient | typeof prisma = prisma,
): Promise<AuditListResult> {
  const page = Math.max(1, params.page);
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, params.pageSize ?? DEFAULT_PAGE_SIZE),
  );
  const where = {
    ...(params.entityType ? { entityType: params.entityType } : {}),
    ...(params.entityId ? { entityId: params.entityId } : {}),
  };
  const [items, total] = await Promise.all([
    tx.auditEntry.findMany({
      where,
      include: { actor: { select: { name: true, role: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    tx.auditEntry.count({ where }),
  ]);
  return {
    items,
    total,
    page,
    pageSize,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
  };
}
