"use server";

import { redirect } from "next/navigation";
import { getAuthProvider } from "@/lib/auth";
import { toActionResult, type ActionResult } from "@/lib/errors";

export async function signInAs(
  _previous: ActionResult<null> | null,
  formData: FormData,
): Promise<ActionResult<null>> {
  try {
    const userId = formData.get("userId");
    await getAuthProvider().signIn({ userId });
  } catch (error: unknown) {
    return toActionResult(error);
  }
  redirect("/");
}
