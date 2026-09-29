import Link from "next/link";
import { notFound } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { QueueDetail } from "@/components/review-queue/queue-detail";
import { TransitionForm } from "@/components/review-queue/transition-form";
import { FeedbackProvider } from "@/components/ui/feedback";
import { PageHeader } from "@/components/ui/page-header";
import { requirePageSession } from "@/lib/auth/session";
import { AppError } from "@/lib/errors";
import {
  availableTransitions,
  getItem,
  summarizeTransition,
} from "@/lib/review-queue/actions";
import { refundTransitionAction } from "@/apps/refunds/actions";
import { refundsQueue } from "@/apps/refunds/config";

export default async function RefundDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requirePageSession();
  const { id } = await params;
  let item;
  try {
    item = await getItem(refundsQueue, session, id);
  } catch (error: unknown) {
    if (error instanceof AppError && error.code === "NOT_FOUND") {
      notFound();
    }
    throw error;
  }
  const transitions = availableTransitions(refundsQueue, item, session).map(
    summarizeTransition,
  );
  return (
    <>
      <AppHeader session={session} />
      <main className="mx-auto max-w-4xl space-y-6 px-6 py-10">
        <nav aria-label="Breadcrumb" className="text-sm text-slate-600">
          <Link className="hover:underline" href={refundsQueue.basePath}>{refundsQueue.title}</Link>
          <span className="px-2">/</span>
          <span className="text-slate-900">{item.refundLabel}</span>
        </nav>
        <PageHeader title={item.refundLabel} description="Synthetic refund request details" />
        <QueueDetail config={refundsQueue} item={item} />
        <FeedbackProvider>
          {transitions.length > 0 ? (
            <section className="space-y-3">
              <h2 className="text-lg font-semibold">Available actions</h2>
              {transitions.map((transition) => (
                <TransitionForm
                  action={refundTransitionAction}
                  id={item.id}
                  key={transition.action}
                  transition={transition}
                />
              ))}
            </section>
          ) : null}
        </FeedbackProvider>
        <Link className="inline-block rounded border border-slate-300 px-4 py-2 text-sm hover:bg-white" href={refundsQueue.basePath}>
          Back to {refundsQueue.title}
        </Link>
      </main>
    </>
  );
}
