import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import {
  availableTransitions,
  listItems,
  runTransition,
} from "@/lib/review-queue/actions";
import { refundsQueue } from "@/apps/refunds/config";
import { REFUND_MANAGER_THRESHOLD_CENTS } from "@/apps/refunds/limits";
import { queueForEntityType } from "@/apps/registry";
import {
  countAuditEntries,
  createRefund,
  createUsers,
  resetDatabase,
  sessionFor,
} from "./helpers/fixtures";

const OVER_THRESHOLD = REFUND_MANAGER_THRESHOLD_CENTS + 1;

async function expectCode(operation: Promise<unknown>, code: string): Promise<void> {
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

describe("refund transitions", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it("requires a manager or admin above the threshold", async () => {
    const users = await createUsers();
    const item = await createRefund({
      amountCents: OVER_THRESHOLD,
      status: "in_review",
      assigneeId: users.analystTwo.id,
    });
    const analyst = sessionFor(users.analystOne);
    await expectCode(
      runTransition(refundsQueue, analyst, { id: item.id, action: "approve" }),
      "FORBIDDEN",
    );
    await expectCode(
      runTransition(refundsQueue, analyst, {
        id: item.id,
        action: "reject",
        comment: "Synthetic rejection reason",
      }),
      "FORBIDDEN",
    );
    expect(await prisma.refund.findUnique({ where: { id: item.id } })).toMatchObject({
      status: "in_review",
    });
    expect(await countAuditEntries(item.id)).toBe(0);
    await runTransition(refundsQueue, sessionFor(users.manager), {
      id: item.id,
      action: "approve",
    });
    expect(await prisma.refund.findUnique({ where: { id: item.id } })).toMatchObject({
      status: "approved",
    });
  });

  it("lets an admin decide above the threshold", async () => {
    const users = await createUsers();
    const item = await createRefund({
      amountCents: OVER_THRESHOLD,
      status: "in_review",
      assigneeId: users.analystOne.id,
    });
    await runTransition(refundsQueue, sessionFor(users.admin), {
      id: item.id,
      action: "reject",
      comment: "Synthetic rejection reason",
    });
    expect(await prisma.refund.findUnique({ where: { id: item.id } })).toMatchObject({
      status: "rejected",
    });
  });

  it("lets an analyst decide at or below the threshold", async () => {
    const users = await createUsers();
    const item = await createRefund({
      amountCents: REFUND_MANAGER_THRESHOLD_CENTS,
      status: "in_review",
      assigneeId: users.analystTwo.id,
    });
    await runTransition(refundsQueue, sessionFor(users.analystOne), {
      id: item.id,
      action: "approve",
    });
    expect(await prisma.refund.findUnique({ where: { id: item.id } })).toMatchObject({
      status: "approved",
    });
  });

  it("hides decisions from analysts above the threshold", async () => {
    const users = await createUsers();
    const item = await createRefund({
      amountCents: OVER_THRESHOLD,
      status: "in_review",
      assigneeId: users.analystTwo.id,
    });
    const stored = await refundsQueue.repository.findById(item.id);
    const actions = availableTransitions(refundsQueue, stored!, sessionFor(users.analystOne));
    expect(actions.map((transition) => transition.action)).toEqual([]);
    const managerActions = availableTransitions(refundsQueue, stored!, sessionFor(users.manager));
    expect(managerActions.map((transition) => transition.action)).toEqual(["approve", "reject"]);
  });

  it("assigns the reviewer and enforces maker-checker", async () => {
    const users = await createUsers();
    const item = await createRefund({ status: "pending" });
    await runTransition(refundsQueue, sessionFor(users.manager), {
      id: item.id,
      action: "start_review",
    });
    expect(await prisma.refund.findUnique({ where: { id: item.id } })).toMatchObject({
      status: "in_review",
      assigneeId: users.manager.id,
    });
    await expectCode(
      runTransition(refundsQueue, sessionFor(users.manager), { id: item.id, action: "approve" }),
      "SELF_APPROVAL",
    );
    await runTransition(refundsQueue, sessionFor(users.analystOne), {
      id: item.id,
      action: "approve",
    });
    expect(await prisma.refund.findUnique({ where: { id: item.id } })).toMatchObject({
      status: "approved",
    });
  });

  it("requires a comment to reject", async () => {
    const users = await createUsers();
    const item = await createRefund({ status: "in_review", assigneeId: users.analystOne.id });
    await expectCode(
      runTransition(refundsQueue, sessionFor(users.manager), { id: item.id, action: "reject" }),
      "COMMENT_REQUIRED",
    );
    expect(await countAuditEntries(item.id)).toBe(0);
  });

  it("writes one audit entry per transition without the order reference", async () => {
    const users = await createUsers();
    const item = await createRefund({ status: "pending" });
    await runTransition(refundsQueue, sessionFor(users.analystOne), {
      id: item.id,
      action: "start_review",
    });
    await runTransition(refundsQueue, sessionFor(users.analystTwo), {
      id: item.id,
      action: "approve",
    });
    const entries = await prisma.auditEntry.findMany({
      where: { entityId: item.id },
      orderBy: { createdAt: "asc" },
    });
    expect(entries).toHaveLength(2);
    expect(entries.map((entry) => entry.action)).toEqual(["start_review", "approve"]);
    expect(entries.every((entry) => entry.entityType === refundsQueue.entityType)).toBe(true);
    const started = auditChanges(entries[0].changes);
    expect(started.before.status).toBe("pending");
    expect(started.after.status).toBe("in_review");
    expect(started.after.assigneeId).toBe(users.analystOne.id);
    expect(auditChanges(entries[1].changes).after.status).toBe("approved");
    for (const entry of entries) {
      expect(entry.changes).not.toContain("orderReference");
      expect(entry.changes).not.toContain("test-order");
    }
  });
});

describe("refund list", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it("filters by amount band and reason", async () => {
    const users = await createUsers();
    await Promise.all([
      createRefund({ amountCents: 12_50, reason: "damaged_item", refundLabel: "Refund RF-001" }),
      createRefund({
        amountCents: REFUND_MANAGER_THRESHOLD_CENTS,
        reason: "not_received",
        refundLabel: "Refund RF-002",
      }),
      createRefund({ amountCents: OVER_THRESHOLD, reason: "not_received", refundLabel: "Refund RF-003" }),
      createRefund({ amountCents: 275_000, reason: "other", refundLabel: "Refund RF-004" }),
    ]);
    const session = sessionFor(users.analystOne);
    const over = await listItems(refundsQueue, session, { amountBand: "over_threshold" });
    expect(over.items.map((item) => item.refundLabel).sort()).toEqual([
      "Refund RF-003",
      "Refund RF-004",
    ]);
    const upTo = await listItems(refundsQueue, session, { amountBand: "up_to_threshold" });
    expect(upTo.total).toBe(2);
    const combined = await listItems(refundsQueue, session, {
      amountBand: "up_to_threshold",
      reason: "not_received",
    });
    expect(combined.items.map((item) => item.refundLabel)).toEqual(["Refund RF-002"]);
    await expectCode(
      listItems(refundsQueue, session, { amountBand: "huge" }),
      "VALIDATION",
    );
  });

  it("registers the queue for audit links", () => {
    expect(queueForEntityType(refundsQueue.entityType)?.basePath).toBe(refundsQueue.basePath);
    expect(queueForEntityType("unknown")).toBeUndefined();
  });
});
