import type { Prisma } from "@prisma/client";
import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import { recordAudit } from "@/lib/audit/record";
import { AppError } from "@/lib/errors";
import {
  createKycCase,
  createUsers,
  resetDatabase,
  sessionFor,
} from "./helpers/fixtures";
import { updateNotes } from "@/lib/review-queue/actions";
import { kycQueue } from "@/apps/kyc/config";

describe("audit log", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it("stores only changed and non-redacted fields", async () => {
    let data: Prisma.AuditEntryCreateArgs["data"] | undefined;
    const tx = {
      auditEntry: {
        create: async (args: Prisma.AuditEntryCreateArgs) => {
          data = args.data;
          return {} as never;
        },
      },
    } as unknown as Prisma.TransactionClient;
    await recordAudit(tx, {
      actorId: "actor-id",
      action: "update",
      entityType: "kyc_case",
      entityId: "case-id",
      before: { status: "pending", customerEmail: "hidden@example.com", country: "AQ" },
      after: { status: "approved", customerEmail: "new-hidden@example.com", country: "AQ" },
    });
    expect(data?.changes).toBe(
      JSON.stringify({ before: { status: "pending" }, after: { status: "approved" } }),
    );
  });

  it("writes notes changes with update action", async () => {
    const users = await createUsers();
    const item = await createKycCase({ assigneeId: users.analystTwo.id });
    await updateNotes(kycQueue, sessionFor(users.analystOne), {
      id: item.id,
      notes: "Synthetic review note",
    });
    const entry = await prisma.auditEntry.findFirst({ where: { entityId: item.id } });
    expect(entry?.action).toBe("update");
    expect(JSON.parse(entry?.changes ?? "{}")).toEqual({
      before: { notes: "" },
      after: { notes: "Synthetic review note" },
    });
  });

  it("enforces append-only audit entries", async () => {
    const users = await createUsers();
    const entry = await prisma.auditEntry.create({
      data: {
        actorId: users.admin.id,
        action: "update",
        entityType: "kyc_case",
        entityId: "case-id",
        changes: JSON.stringify({ before: {}, after: {} }),
      },
    });
    const operations = [
      () => prisma.auditEntry.update({ where: { id: entry.id }, data: { comment: "x" } }),
      () => prisma.auditEntry.delete({ where: { id: entry.id } }),
      () => prisma.auditEntry.deleteMany({ where: { id: entry.id } }),
      () => prisma.auditEntry.updateMany({ where: { id: entry.id }, data: { comment: "x" } }),
    ];
    for (const operation of operations) {
      await expect(operation()).rejects.toMatchObject({ code: "AUDIT_IMMUTABLE" });
    }
  });

  it("returns an AppError for immutable operations", async () => {
    const users = await createUsers();
    const entry = await prisma.auditEntry.create({
      data: {
        actorId: users.admin.id,
        action: "update",
        entityType: "kyc_case",
        entityId: "case-id",
        changes: JSON.stringify({ before: {}, after: {} }),
      },
    });
    try {
      await prisma.auditEntry.delete({ where: { id: entry.id } });
    } catch (error: unknown) {
      expect(error).toBeInstanceOf(AppError);
      expect((error as AppError).code).toBe("AUDIT_IMMUTABLE");
    }
  });
});
