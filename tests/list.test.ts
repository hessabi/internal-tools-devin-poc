import { beforeEach, describe, expect, it } from "vitest";
import { listItems } from "@/lib/review-queue/actions";
import { MAX_PAGE_SIZE } from "@/lib/config/pagination";
import { kycQueue } from "@/apps/kyc/config";
import {
  createKycCase,
  createUsers,
  resetDatabase,
  sessionFor,
} from "./helpers/fixtures";

describe("queue lists", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it("clamps page size and validates filter keys and options", async () => {
    const users = await createUsers();
    const session = sessionFor(users.manager);
    const clamped = await listItems(kycQueue, session, { pageSize: "500" });
    expect(clamped.pageSize).toBe(MAX_PAGE_SIZE);
    await expect(
      listItems(kycQueue, session, { unsupported: "value" }),
    ).rejects.toMatchObject({ code: "VALIDATION" });
    await expect(
      listItems(kycQueue, session, { status: "not-a-status" }),
    ).rejects.toMatchObject({ code: "VALIDATION" });
  });

  it("filters rows by status", async () => {
    const users = await createUsers();
    await Promise.all([
      createKycCase({ status: "pending", customerLabel: "Test Customer 001" }),
      createKycCase({ status: "pending", customerLabel: "Test Customer 002" }),
      createKycCase({ status: "pending", customerLabel: "Test Customer 003" }),
      createKycCase({ status: "approved", customerLabel: "Test Customer 004" }),
      createKycCase({ status: "approved", customerLabel: "Test Customer 005" }),
    ]);
    const result = await listItems(kycQueue, sessionFor(users.manager), {
      status: "approved",
    });
    expect(result.total).toBe(2);
    expect(result.items).toHaveLength(2);
    expect(result.items.every((item) => item.status === "approved")).toBe(true);
  });
});
