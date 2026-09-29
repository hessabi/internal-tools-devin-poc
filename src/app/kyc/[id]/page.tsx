import Link from "next/link";
import { notFound } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { NotesForm } from "@/components/review-queue/notes-form";
import { QueueDetail } from "@/components/review-queue/queue-detail";
import { TransitionForm } from "@/components/review-queue/transition-form";
import { PageHeader } from "@/components/ui/page-header";
import { requirePageSession } from "@/lib/auth/session";
import { AppError } from "@/lib/errors";
import { availableTransitions, getItem } from "@/lib/review-queue/actions";
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
  const transitions = availableTransitions(kycQueue, item, session);
  return (
    <>
      <AppHeader session={session} />
      <main className="mx-auto max-w-4xl space-y-6 px-6 py-10">
        <Link className="text-sm text-slate-600 hover:underline" href="/kyc">
          Back to KYC queue
        </Link>
        <PageHeader title={item.customerLabel} description="Synthetic KYC case details" />
        <QueueDetail config={kycQueue} item={item} />
        <NotesForm action={kycNotesAction} id={item.id} notes={item.notes} />
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
      </main>
    </>
  );
}
