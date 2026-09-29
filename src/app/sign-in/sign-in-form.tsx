"use client";

import { useActionState } from "react";
import { signInAs } from "@/app/sign-in/actions";
import type { ActionResult } from "@/lib/errors";

export function SignInForm({ userId }: { userId: string }) {
  const [state, action] = useActionState<ActionResult<null> | null, FormData>(
    signInAs,
    null,
  );
  return (
    <form action={action}>
      <input name="userId" type="hidden" value={userId} />
      <button
        className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        type="submit"
      >
        Sign in as
      </button>
      {state && !state.ok ? (
        <p className="mt-2 text-sm text-red-700">{state.message}</p>
      ) : null}
    </form>
  );
}
