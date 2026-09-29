"use client";

import { useActionState } from "react";
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
  const [state, formAction] = useActionState<ActionResult<null> | null, FormData>(
    action,
    null,
  );
  return (
    <form className="rounded border border-slate-200 bg-white p-5" action={formAction}>
      <input name="id" type="hidden" value={id} />
      <label className="block text-sm font-medium" htmlFor="notes">Notes</label>
      <textarea className="mt-2 w-full rounded border border-slate-300 p-2" defaultValue={notes} id="notes" maxLength={2000} name="notes" rows={5} />
      <button className="mt-3 rounded border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50" type="submit">
        Save notes
      </button>
      {state && !state.ok ? <p className="mt-2 text-sm text-red-700">{state.message}</p> : null}
    </form>
  );
}
