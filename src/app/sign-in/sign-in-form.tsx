"use client";

import { useActionState } from "react";
import { signInAs } from "@/app/sign-in/actions";
import { Button } from "@/components/ui/button";
import type { ActionResult } from "@/lib/errors";

export function SignInForm({ userId }: { userId: string }) {
  const [state, action, pending] = useActionState<ActionResult<null> | null, FormData>(
    signInAs,
    null,
  );
  return (
    <form action={action}>
      <input name="userId" type="hidden" value={userId} />
      <Button disabled={pending} size="sm" type="submit">
        {pending ? "Signing in..." : "Sign in as"}
      </Button>
      {state && !state.ok ? (
        <p className="mt-2 text-sm text-destructive">{state.message}</p>
      ) : null}
    </form>
  );
}
