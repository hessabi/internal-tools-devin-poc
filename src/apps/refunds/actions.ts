"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth/session";
import { toActionResult, type ActionResult } from "@/lib/errors";
import { runTransition } from "@/lib/review-queue/actions";
import { refundsQueue } from "@/apps/refunds/config";

function formInput(formData: FormData): Record<string, string> {
  return Object.fromEntries(
    [...formData.entries()].map(([key, value]) => [key, String(value)]),
  );
}

export async function refundTransitionAction(
  _previous: ActionResult<null> | null,
  formData: FormData,
): Promise<ActionResult<null>> {
  try {
    const session = await requireSession();
    await runTransition(refundsQueue, session, formInput(formData));
    revalidatePath(refundsQueue.basePath);
    revalidatePath(`${refundsQueue.basePath}/${formData.get("id") ?? ""}`);
    return { ok: true, data: null };
  } catch (error: unknown) {
    return toActionResult(error);
  }
}
