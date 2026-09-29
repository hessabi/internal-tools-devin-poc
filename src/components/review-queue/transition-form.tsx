"use client";

import { useActionState, useRef } from "react";
import { SubmitButton } from "@/components/ui/submit-button";
import { useFeedback } from "@/components/ui/feedback";
import type { ActionResult } from "@/lib/errors";
import type { TransitionSummary } from "@/lib/review-queue/types";

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
  transition: TransitionSummary;
  action: TransitionAction;
}) {
  const showFeedback = useFeedback();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState<ActionResult<null> | null, FormData>(
    async (previous, formData) => {
      const result = await action(previous, formData);
      if (result.ok) {
        formRef.current?.reset();
        showFeedback({ kind: "success", message: transition.successMessage });
      } else {
        showFeedback({ kind: "error", message: `${transition.label} failed: ${result.message}` });
      }
      return result;
    },
    null,
  );
  return (
    <form className="rounded border border-slate-200 bg-white p-4" action={formAction} ref={formRef}>
      <input name="id" type="hidden" value={id} />
      <input name="action" type="hidden" value={transition.action} />
      {transition.requireComment ? (
        <label className="block text-sm">
          <span className="font-medium">Comment</span>
          <textarea className="mt-1 w-full rounded border border-slate-300 p-2" name="comment" required rows={3} />
        </label>
      ) : null}
      <SubmitButton label={transition.label} pending={pending} variant="primary" />
      {state && !state.ok ? <p className="mt-2 text-sm text-red-700">{state.message}</p> : null}
    </form>
  );
}
