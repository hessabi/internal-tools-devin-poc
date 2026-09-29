import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import { availableTransitions, runTransition } from "@/lib/review-queue/actions";
import {
  createKycCase,
  createUsers,
  countAuditEntries,
  resetDatabase,
  sessionFor,
} from "./helpers/fixtures";
import { kycQueue } from "@/apps/kyc/config";

async function expectCode(
  operation: Promise<unknown>,
  code: string,
): Promise<void> {
  await expect(operation).rejects.toMatchObject({ code });
}

function auditChanges(changes: string): {
  before: Record<string, unknown>;
  after: Record<string, unknown>;
} {
  return JSON.parse(changes) as {
    before: Record<string, unknown>;
    after: Record<string, unknown>;
  };
}

describe("KYC transitions", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it("blocks analyst high-risk approval and allows a manager", async () => {
    const users = await createUsers();
    const item = await createKycCase({
      riskLevel: "high",
      status: "in_review",
      assigneeId: users.analystTwo.id,
    });
    await expectCode(
      runTransition(kycQueue, sessionFor(users.analystOne), {
        id: item.id,
        action: "approve",
      }),
      "FORBIDDEN",
    );
    expect(await prisma.kycCase.findUnique({ where: { id: item.id } })).toMatchObject({
      status: "in_review",
    });
    expect(await countAuditEntries(item.id)).toBe(0);
    await runTransition(kycQueue, sessionFor(users.manager), {
      id: item.id,
      action: "approve",
    });
    expect(await prisma.kycCase.findUnique({ where: { id: item.id } })).toMatchObject({
      status: "approved",
    });
  });

  it("allows analysts to approve low and medium risk cases", async () => {
    const users = await createUsers();
    for (const riskLevel of ["low", "medium"]) {
      const item = await createKycCase({
        riskLevel,
        status: "in_review",
        assigneeId: users.analystTwo.id,
      });
      await runTransition(kycQueue, sessionFor(users.analystOne), {
        id: item.id,
        action: "approve",
      });
      expect(await prisma.kycCase.findUnique({ where: { id: item.id } })).toMatchObject({
        status: "approved",
      });
    }
  });

  it("enforces maker-checker rules", async () => {
    const users = await createUsers();
    const item = await createKycCase({ status: "pending" });
    await runTransition(kycQueue, sessionFor(users.analystOne), {
      id: item.id,
      action: "start_review",
    });
    const assigned = await prisma.kycCase.findUnique({ where: { id: item.id } });
    expect(assigned?.assigneeId).toBe(users.analystOne.id);
    const available = availableTransitions(
      kycQueue,
      {
        ...assigned!,
        status: "in_review" as const,
        riskLevel: "low" as const,
        assignee: null,
      },
      sessionFor(users.analystOne),
    );
    expect(available.map((transition) => transition.action)).not.toContain("approve");
    expect(available.map((transition) => transition.action)).not.toContain("reject");
    await expectCode(
      runTransition(kycQueue, sessionFor(users.analystOne), {
        id: item.id,
        action: "approve",
      }),
      "SELF_APPROVAL",
    );
    await expectCode(
      runTransition(kycQueue, sessionFor(users.analystOne), {
        id: item.id,
        action: "reject",
        comment: "Synthetic rejection reason",
      }),
      "SELF_APPROVAL",
    );
    await runTransition(kycQueue, sessionFor(users.analystTwo), {
      id: item.id,
      action: "approve",
    });
  });

  it("writes one audit entry for every transition", async () => {
    const users = await createUsers();
    const startCase = await createKycCase({ status: "pending" });
    await runTransition(kycQueue, sessionFor(users.analystOne), {
      id: startCase.id,
      action: "start_review",
    });
    const startEntry = await prisma.auditEntry.findFirst({ where: { entityId: startCase.id } });
    const startChanges = auditChanges(startEntry?.changes ?? "{}");
    expect(startEntry).toMatchObject({
      actorId: users.analystOne.id,
      action: "start_review",
      entityType: "kyc_case",
    });
    expect(startChanges.before.status).toBe("pending");
    expect(startChanges.after.status).toBe("in_review");
    expect(startChanges.after.assigneeId).toBe(users.analystOne.id);
    expect(startEntry?.changes).not.toContain("customerEmail");
    expect(startEntry?.changes).not.toContain("updatedAt");

    const approveCase = await createKycCase({
      status: "in_review",
      assigneeId: users.analystOne.id,
    });
    await runTransition(kycQueue, sessionFor(users.analystTwo), {
      id: approveCase.id,
      action: "approve",
    });
    const rejectCase = await createKycCase({
      status: "in_review",
      assigneeId: users.analystOne.id,
    });
    await runTransition(kycQueue, sessionFor(users.analystTwo), {
      id: rejectCase.id,
      action: "reject",
      comment: "Synthetic rejection reason",
    });
    for (const id of [approveCase.id, rejectCase.id]) {
      expect(await countAuditEntries(id)).toBe(1);
      const entry = await prisma.auditEntry.findFirst({ where: { entityId: id } });
      expect(entry?.actorId).toBe(users.analystTwo.id);
      expect(entry?.entityType).toBe("kyc_case");
      expect(auditChanges(entry?.changes ?? "{}").before.status).toBe("in_review");
    }
  });

  it("rejects invalid transitions without writing", async () => {
    const users = await createUsers();
    const rejected = await createKycCase({ status: "rejected" });
    await expectCode(
      runTransition(kycQueue, sessionFor(users.manager), {
        id: rejected.id,
        action: "approve",
      }),
      "INVALID_TRANSITION",
    );
    const pending = await createKycCase({ status: "in_review" });
    await expectCode(
      runTransition(kycQueue, sessionFor(users.manager), {
        id: pending.id,
        action: "reject",
      }),
      "COMMENT_REQUIRED",
    );
    await expectCode(
      runTransition(kycQueue, sessionFor(users.manager), {
        id: pending.id,
        action: "unknown",
      }),
      "INVALID_TRANSITION",
    );
    await expectCode(runTransition(kycQueue, sessionFor(users.manager), {}), "VALIDATION");
    expect(await countAuditEntries(rejected.id)).toBe(0);
    expect(await countAuditEntries(pending.id)).toBe(0);
  });
});
