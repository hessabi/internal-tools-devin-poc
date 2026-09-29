"use client";

import { useActionState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
    <Card>
      <CardContent>
        <form action={formAction} className="space-y-3">
          <input name="id" type="hidden" value={id} />
          <Label htmlFor="notes">Notes</Label>
          <Textarea defaultValue={notes} id="notes" maxLength={2000} name="notes" rows={5} />
          <SubmitButton label="Save notes" pending={pending} variant="secondary" />
          {state && !state.ok ? <p className="text-sm text-destructive">{state.message}</p> : null}
        </form>
      </CardContent>
    </Card>
  );
}
