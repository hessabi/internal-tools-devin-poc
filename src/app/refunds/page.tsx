import { AppHeader } from "@/components/app-header";
import { Pagination } from "@/components/review-queue/pagination";
import { QueueFilters } from "@/components/review-queue/queue-filters";
import { QueueList } from "@/components/review-queue/queue-list";
import { PageHeader } from "@/components/ui/page-header";
import { requirePageSession } from "@/lib/auth/session";
import { listItems } from "@/lib/review-queue/actions";
import { refundsQueue } from "@/apps/refunds/config";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function RefundsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await requirePageSession();
  const values = await searchParams;
  const result = await listItems(refundsQueue, session, values);
  return (
    <>
      <AppHeader session={session} />
      <main className="mx-auto max-w-6xl space-y-6 px-6 py-8">
        <PageHeader title={refundsQueue.title} description={refundsQueue.description} />
        <QueueFilters filters={refundsQueue.filters} values={values} />
        <QueueList basePath={refundsQueue.basePath} columns={refundsQueue.listColumns} items={result.items} />
        <Pagination page={result.page} pageCount={result.pageCount} values={values} />
      </main>
    </>
  );
}
