import Link from "next/link";
import { notFound } from "next/navigation";
import { AppHeader } from "@/components/app-header";
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
      <main className="mx-auto max-w-4xl space-y-6 px-6 py-8">
        <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
          <Link className="hover:underline" href={refundsQueue.basePath}>{refundsQueue.title}</Link>
          <span className="px-2">/</span>
          <span className="text-foreground">{item.refundLabel}</span>
        </nav>
        <PageHeader title={item.refundLabel} description="Synthetic refund request details" />
        <QueueDetail config={refundsQueue} item={item} />
        <FeedbackProvider>
          {transitions.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Available actions</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap items-start gap-3">
              {transitions.map((transition) => (
                <TransitionForm
                  action={refundTransitionAction}
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
          <Link href={refundsQueue.basePath}>Back to {refundsQueue.title}</Link>
        </Button>
      </main>
    </>
  );
}
