"use client";

import { useActionState } from "react";
import { SubmitButton } from "@/components/ui/submit-button";
import { useFeedback } from "@/components/ui/feedback";
import type { ActionResult } from "@/lib/errors";

type NotesAction = (
  previous: ActionResult<null> | null,
  formData: FormData,
) => Promise<ActionResult<null>>;

export function NotesForm({
  id,
  notes,
  action,
}: {
  id: string;
  notes: string;
  action: NotesAction;
}) {
  const showFeedback = useFeedback();
  const [state, formAction, pending] = useActionState<ActionResult<null> | null, FormData>(
    async (previous, formData) => {
      const result = await action(previous, formData);
      showFeedback(
        result.ok
          ? { kind: "success", message: "Notes saved." }
          : { kind: "error", message: `Notes were not saved: ${result.message}` },
      );
      return result;
    },
    null,
  );
  return (
    <form className="rounded border border-slate-200 bg-white p-5" action={formAction}>
      <input name="id" type="hidden" value={id} />
      <label className="block text-sm font-medium" htmlFor="notes">Notes</label>
      <textarea className="mt-2 w-full rounded border border-slate-300 p-2" defaultValue={notes} id="notes" maxLength={2000} name="notes" rows={5} />
      <SubmitButton label="Save notes" pending={pending} variant="secondary" />
      {state && !state.ok ? <p className="mt-2 text-sm text-red-700">{state.message}</p> : null}
    </form>
  );
}
