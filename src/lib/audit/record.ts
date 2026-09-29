import type { Prisma } from "@prisma/client";
import type { AuditAction } from "@/lib/config/states";

const REDACTED_FIELDS = new Set(["customerEmail", "updatedAt", "assignee"]);

type AuditRecord = Record<string, unknown>;

type RecordAuditInput = {
  actorId: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  before: AuditRecord;
  after: AuditRecord;
  comment?: string;
};

function equalValues(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function diffRecords(
  before: AuditRecord,
  after: AuditRecord,
): { before: AuditRecord; after: AuditRecord } {
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  const changedBefore: AuditRecord = {};
  const changedAfter: AuditRecord = {};
  for (const key of keys) {
    if (REDACTED_FIELDS.has(key)) {
      continue;
    }
    if (!equalValues(before[key], after[key])) {
      if (key in before) {
        changedBefore[key] = before[key];
      }
      if (key in after) {
        changedAfter[key] = after[key];
      }
    }
  }
  return { before: changedBefore, after: changedAfter };
}

export async function recordAudit(
  tx: Prisma.TransactionClient,
  input: RecordAuditInput,
): Promise<void> {
  const changes = diffRecords(input.before, input.after);
  await tx.auditEntry.create({
    data: {
      actorId: input.actorId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      changes: JSON.stringify(changes),
      comment: input.comment?.trim() || null,
    },
  });
}
