"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth/session";
import { toActionResult, type ActionResult } from "@/lib/errors";
import { runTransition, updateNotes } from "@/lib/review-queue/actions";
import { kycQueue } from "@/apps/kyc/config";

function formInput(formData: FormData): Record<string, string> {
  return Object.fromEntries(
    [...formData.entries()].map(([key, value]) => [key, String(value)]),
  );
}

export async function kycTransitionAction(
  _previous: ActionResult<null> | null,
  formData: FormData,
): Promise<ActionResult<null>> {
  try {
    const session = await requireSession();
    await runTransition(kycQueue, session, formInput(formData));
    revalidatePath("/kyc");
    revalidatePath(`/kyc/${formData.get("id") ?? ""}`);
    return { ok: true, data: null };
  } catch (error: unknown) {
    return toActionResult(error);
  }
}

export async function kycNotesAction(
  _previous: ActionResult<null> | null,
  formData: FormData,
): Promise<ActionResult<null>> {
  try {
    const session = await requireSession();
    await updateNotes(kycQueue, session, formInput(formData));
    revalidatePath(`/kyc/${formData.get("id") ?? ""}`);
    return { ok: true, data: null };
  } catch (error: unknown) {
    return toActionResult(error);
  }
}
