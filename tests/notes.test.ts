import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import { updateNotes } from "@/lib/review-queue/actions";
import { kycQueue } from "@/apps/kyc/config";
import {
  countAuditEntries,
  createKycCase,
  createUsers,
  resetDatabase,
  sessionFor,
} from "./helpers/fixtures";

describe("notes lock", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it.each(["approved", "rejected"])(
    "rejects notes edits on a %s case without writing",
    async (status) => {
      const users = await createUsers();
      const item = await createKycCase({ status });
      await expect(
        updateNotes(kycQueue, sessionFor(users.admin), {
          id: item.id,
          notes: "Late synthetic note",
        }),
      ).rejects.toMatchObject({ code: "NOTES_LOCKED" });
      const stored = await prisma.kycCase.findUnique({ where: { id: item.id } });
      expect(stored?.notes).toBe("");
      expect(await countAuditEntries(item.id)).toBe(0);
    },
  );

  it("allows notes edits while a case is in review", async () => {
    const users = await createUsers();
    const item = await createKycCase({ status: "in_review", assigneeId: users.analystOne.id });
    const updated = await updateNotes(kycQueue, sessionFor(users.analystOne), {
      id: item.id,
      notes: "Synthetic review note",
    });
    expect(updated.notes).toBe("Synthetic review note");
  });
});
