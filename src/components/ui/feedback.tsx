"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Feedback = { kind: "success" | "error"; message: string };

const FeedbackContext = createContext<(feedback: Feedback) => void>(() => undefined);

export function useFeedback(): (feedback: Feedback) => void {
  return useContext(FeedbackContext);
}

export function FeedbackProvider({ children }: { children: React.ReactNode }) {
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const show = useCallback((next: Feedback) => setFeedback(next), []);
  return (
    <FeedbackContext.Provider value={show}>
      {feedback ? (
        <div
          className={cn(
            "flex items-center justify-between gap-4 rounded-lg border p-3 text-sm",
            feedback.kind === "success"
              ? "border-green-200 bg-green-50 text-green-900"
              : "border-destructive/30 bg-destructive/10 text-destructive",
          )}
          role={feedback.kind === "success" ? "status" : "alert"}
        >
          <span>{feedback.message}</span>
          <Button onClick={() => setFeedback(null)} size="sm" type="button" variant="ghost">
            Dismiss
          </Button>
        </div>
      ) : null}
      {children}
    </FeedbackContext.Provider>
  );
}
