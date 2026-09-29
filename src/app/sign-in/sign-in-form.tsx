"use client";

import { useActionState } from "react";
import { signInAs } from "@/app/sign-in/actions";
import { Button } from "@/components/ui/button";
import type { ActionResult } from "@/lib/errors";

export function SignInForm({ userId, children }: { userId: string; children: React.ReactNode }) {
  const [state, action, pending] = useActionState<ActionResult<null> | null, FormData>(
    signInAs,
    null,
  );
  return (
    <form action={action}>
      <input name="userId" type="hidden" value={userId} />
      <Button className="w-full justify-between" disabled={pending} size="lg" type="submit" variant="outline">
        {children}
        {pending ? <span className="text-xs text-muted-foreground">Signing in...</span> : null}
      </Button>
      {state && !state.ok ? (
        <p className="mt-2 text-sm text-destructive">{state.message}</p>
      ) : null}
    </form>
  );
}
