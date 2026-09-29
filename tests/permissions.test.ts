import { beforeEach, describe, expect, it } from "vitest";
import { can } from "@/lib/auth/permissions";
import { listItems } from "@/lib/review-queue/actions";
import { kycQueue } from "@/apps/kyc/config";
import {
  createKycCase,
  createUsers,
  resetDatabase,
  sessionFor,
} from "./helpers/fixtures";

describe("permissions and reads", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it("enforces queue read roles in shared actions", async () => {
    const users = await createUsers();
    const restrictedQueue = { ...kycQueue, readRoles: ["manager"] as const };
    await expect(
      listItems(restrictedQueue, sessionFor(users.analystOne), {}),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("allows audit visibility only to managers and admins", async () => {
    const users = await createUsers();
    expect(can(sessionFor(users.analystOne), "viewAuditLog")).toBe(false);
    expect(can(sessionFor(users.manager), "viewAuditLog")).toBe(true);
    expect(can(sessionFor(users.admin), "viewAuditLog")).toBe(true);
  });

  it("rejects a restricted queue read without changing data", async () => {
    const users = await createUsers();
    const item = await createKycCase({ riskLevel: "high", status: "in_review" });
    const restrictedQueue = { ...kycQueue, readRoles: ["manager"] as const };
    await expect(
      listItems(restrictedQueue, sessionFor(users.analystOne), { page: "1" }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(item.status).toBe("in_review");
  });
});
