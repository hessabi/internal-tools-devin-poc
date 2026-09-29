"use client";

import { createContext, useCallback, useContext, useState } from "react";

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
          className={`flex items-start justify-between gap-4 rounded border p-3 text-sm ${
            feedback.kind === "success"
              ? "border-green-200 bg-green-50 text-green-900"
              : "border-red-200 bg-red-50 text-red-900"
          }`}
          role={feedback.kind === "success" ? "status" : "alert"}
        >
          <span>{feedback.message}</span>
          <button className="font-medium hover:underline" onClick={() => setFeedback(null)} type="button">
            Dismiss
          </button>
        </div>
      ) : null}
      {children}
    </FeedbackContext.Provider>
  );
}
