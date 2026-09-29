"use client";

import { useActionState } from "react";
import type { ActionResult } from "@/lib/errors";
import type { Transition } from "@/lib/review-queue/types";

type TransitionAction = (
  previous: ActionResult<null> | null,
  formData: FormData,
) => Promise<ActionResult<null>>;

export function TransitionForm({
  id,
  transition,
  action,
}: {
  id: string;
  transition: Transition<{ id: string; status: "pending" | "in_review" | "approved" | "rejected"; assigneeId: string | null }>;
  action: TransitionAction;
}) {
  const [state, formAction] = useActionState<ActionResult<null> | null, FormData>(
    action,
    null,
  );
  return (
    <form className="rounded border border-slate-200 bg-white p-4" action={formAction}>
      <input name="id" type="hidden" value={id} />
      <input name="action" type="hidden" value={transition.action} />
      {transition.requireComment ? (
        <label className="block text-sm">
          <span className="font-medium">Comment</span>
          <textarea className="mt-1 w-full rounded border border-slate-300 p-2" name="comment" required rows={3} />
        </label>
      ) : null}
      <button className="mt-3 rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white" type="submit">
        {transition.label}
      </button>
      {state && !state.ok ? <p className="mt-2 text-sm text-red-700">{state.message}</p> : null}
    </form>
  );
}
