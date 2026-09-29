"use client";

import { useActionState, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
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
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<ActionResult<null> | null, FormData>(
    async (previous, formData) => {
      const result = await action(previous, formData);
      if (result.ok) {
        formRef.current?.reset();
        setOpen(false);
        showFeedback({ kind: "success", message: transition.successMessage });
      } else {
        showFeedback({ kind: "error", message: `${transition.label} failed: ${result.message}` });
      }
      return result;
    },
    null,
  );
  const error = state && !state.ok ? <p className="text-sm text-destructive">{state.message}</p> : null;
  const hiddenFields = (
    <>
      <input name="id" type="hidden" value={id} />
      <input name="action" type="hidden" value={transition.action} />
    </>
  );
  if (!transition.requireComment) {
    return (
      <form action={formAction} className="space-y-2" ref={formRef}>
        {hiddenFields}
        <SubmitButton label={transition.label} pending={pending} variant="primary" />
        {error}
      </form>
    );
  }
  const commentId = `comment-${transition.action}`;
  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline">{transition.label}</Button>
      </DialogTrigger>
      <DialogContent>
        <form action={formAction} className="space-y-4" ref={formRef}>
          <DialogHeader>
            <DialogTitle>{transition.label}</DialogTitle>
            <DialogDescription>A comment is required for this action.</DialogDescription>
          </DialogHeader>
          {hiddenFields}
          <div className="space-y-1.5">
            <Label htmlFor={commentId}>Comment</Label>
            <Textarea id={commentId} name="comment" required rows={3} />
          </div>
          {error}
          <DialogFooter>
            <SubmitButton label={transition.label} pending={pending} variant="primary" />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
