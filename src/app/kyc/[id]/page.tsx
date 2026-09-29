import Link from "next/link";
import { notFound } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { NotesForm } from "@/components/review-queue/notes-form";
import { QueueDetail } from "@/components/review-queue/queue-detail";
import { TransitionForm } from "@/components/review-queue/transition-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FeedbackProvider } from "@/components/ui/feedback";
import { PageHeader } from "@/components/ui/page-header";
import { requirePageSession } from "@/lib/auth/session";
import { AppError } from "@/lib/errors";
import {
  availableTransitions,
  canEditNotes,
  getItem,
  summarizeTransition,
} from "@/lib/review-queue/actions";
import { kycNotesAction, kycTransitionAction } from "@/apps/kyc/actions";
import { kycQueue } from "@/apps/kyc/config";

export default async function KycDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requirePageSession();
  const { id } = await params;
  let item;
  try {
    item = await getItem(kycQueue, session, id);
  } catch (error: unknown) {
    if (error instanceof AppError && error.code === "NOT_FOUND") {
      notFound();
    }
    throw error;
  }
  const transitions = availableTransitions(kycQueue, item, session).map(
    summarizeTransition,
  );
  return (
    <>
      <AppHeader session={session} />
      <main className="mx-auto max-w-4xl space-y-6 px-6 py-8">
        <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
          <Link className="hover:underline" href="/kyc">KYC queue</Link>
          <span className="px-2">/</span>
          <span className="text-foreground">{item.customerLabel}</span>
        </nav>
        <PageHeader title={item.customerLabel} description="Synthetic KYC case details" />
        <QueueDetail config={kycQueue} item={item} />
        <FeedbackProvider>
        {canEditNotes(kycQueue, item) ? (
          <NotesForm action={kycNotesAction} id={item.id} notes={item.notes} />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="whitespace-pre-wrap">{item.notes || "No notes."}</p>
              <p className="text-xs text-muted-foreground">Notes are locked because this case has a decision.</p>
            </CardContent>
          </Card>
        )}
        {transitions.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Available actions</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap items-start gap-3">
            {transitions.map((transition) => (
              <TransitionForm
                action={kycTransitionAction}
                id={item.id}
                key={transition.action}
                transition={transition}
              />
            ))}
            </CardContent>
          </Card>
        ) : null}
        </FeedbackProvider>
        <Button asChild variant="outline">
          <Link href="/kyc">Back to KYC queue</Link>
        </Button>
      </main>
    </>
  );
}
