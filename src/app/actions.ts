"use server";

import { redirect } from "next/navigation";
import { getAuthProvider } from "@/lib/auth";
import { toActionResult, type ActionResult } from "@/lib/errors";

export async function signOutAction(): Promise<ActionResult<null>> {
  try {
    await getAuthProvider().signOut();
  } catch (error: unknown) {
    return toActionResult(error);
  }
  redirect("/sign-in");
}
