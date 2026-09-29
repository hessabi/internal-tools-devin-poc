import type { Prisma } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { recordAudit } from "@/lib/audit/record";
import { availableTransitions, listItems } from "@/lib/review-queue/actions";
import { kycQueue } from "@/apps/kyc/config";
import type { KycCase } from "@/apps/kyc/types";
import type { Session } from "@/lib/auth/provider";

const analyst: Session = {
  userId: "analyst-id",
  email: "analyst.one@example.com",
  name: "Test Analyst 01",
  role: "analyst",
};

const manager: Session = {
  userId: "manager-id",
  email: "manager.one@example.com",
  name: "Test Manager 01",
  role: "manager",
};

const highRiskCase = {
  id: "case-id",
  customerLabel: "Test Customer 001",
  customerEmail: "test.customer.001@example.com",
  country: "AQ",
  riskLevel: "high",
  status: "in_review",
  assigneeId: "other-id",
  assignee: { id: "other-id", name: "Test Analyst 02", role: "analyst" },
  notes: "",
  submittedAt: new Date("2025-01-01T00:00:00.000Z"),
  createdAt: new Date("2025-01-01T00:00:00.000Z"),
  updatedAt: new Date("2025-01-01T00:00:00.000Z"),
} satisfies KycCase;

describe("review queue permissions", () => {
  it("does not offer high-risk approval to an analyst", () => {
    const actions = availableTransitions(kycQueue, highRiskCase, analyst);
    expect(actions.map((action) => action.action)).not.toContain("approve");
    expect(actions.map((action) => action.action)).not.toContain("reject");
  });

  it("offers high-risk approval to a manager", () => {
    const actions = availableTransitions(kycQueue, highRiskCase, manager);
    expect(actions.map((action) => action.action)).toContain("approve");
  });

  it("clamps list page size and rejects unknown filters", async () => {
    const fakeConfig = {
      ...kycQueue,
      repository: {
        ...kycQueue.repository,
        list: async ({ pageSize }: { pageSize: number }) => ({
          items: [],
          total: pageSize,
        }),
      },
    };
    const result = await listItems(fakeConfig, analyst, { pageSize: "500" });
    expect(result.pageSize).toBe(50);
    await expect(
      listItems(fakeConfig, analyst, { unsupported: "value" }),
    ).rejects.toMatchObject({ code: "VALIDATION" });
  });
});

describe("audit recording", () => {
  it("writes only changed and non-redacted fields", async () => {
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
      before: {
        status: "pending",
        customerEmail: "hidden@example.com",
        country: "AQ",
      },
      after: {
        status: "approved",
        customerEmail: "new-hidden@example.com",
        country: "AQ",
      },
    });
    expect(data?.changes).toBe(
      JSON.stringify({
        before: { status: "pending" },
        after: { status: "approved" },
      }),
    );
  });
});
