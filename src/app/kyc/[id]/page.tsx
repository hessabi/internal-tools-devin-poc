import Link from "next/link";
import { notFound } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { NotesForm } from "@/components/review-queue/notes-form";
import { QueueDetail } from "@/components/review-queue/queue-detail";
import { TransitionForm } from "@/components/review-queue/transition-form";
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
      <main className="mx-auto max-w-4xl space-y-6 px-6 py-10">
        <nav aria-label="Breadcrumb" className="text-sm text-slate-600">
          <Link className="hover:underline" href="/kyc">KYC queue</Link>
          <span className="px-2">/</span>
          <span className="text-slate-900">{item.customerLabel}</span>
        </nav>
        <PageHeader title={item.customerLabel} description="Synthetic KYC case details" />
        <QueueDetail config={kycQueue} item={item} />
        <FeedbackProvider>
        {canEditNotes(kycQueue, item) ? (
          <NotesForm action={kycNotesAction} id={item.id} notes={item.notes} />
        ) : (
          <section className="rounded border border-slate-200 bg-white p-5">
            <h2 className="text-sm font-medium">Notes</h2>
            <p className="mt-2 whitespace-pre-wrap text-sm">{item.notes || "No notes."}</p>
            <p className="mt-2 text-xs text-slate-600">Notes are locked because this case has a decision.</p>
          </section>
        )}
        {transitions.length > 0 ? (
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Available actions</h2>
            {transitions.map((transition) => (
              <TransitionForm
                action={kycTransitionAction}
                id={item.id}
                key={transition.action}
                transition={transition}
              />
            ))}
          </section>
        ) : null}
        </FeedbackProvider>
        <Link className="inline-block rounded border border-slate-300 px-4 py-2 text-sm hover:bg-white" href="/kyc">
          Back to KYC queue
        </Link>
      </main>
    </>
  );
}
