import { redirect } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { Pagination } from "@/components/review-queue/pagination";
import { QueueFilters } from "@/components/review-queue/queue-filters";
import { QueueList } from "@/components/review-queue/queue-list";
import { PageHeader } from "@/components/ui/page-header";
import { requireSession } from "@/lib/auth/session";
import { AppError } from "@/lib/errors";
import { listItems } from "@/lib/review-queue/actions";
import { kycQueue } from "@/apps/kyc/config";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function KycPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  let session;
  try {
    session = await requireSession();
  } catch (error: unknown) {
    if (error instanceof AppError && error.code === "UNAUTHENTICATED") {
      redirect("/sign-in");
    }
    throw error;
  }
  const values = await searchParams;
  const result = await listItems(kycQueue, session, values);
  return (
    <>
      <AppHeader session={session} />
      <main className="mx-auto max-w-6xl space-y-6 px-6 py-10">
        <PageHeader title={kycQueue.title} description={kycQueue.description} />
        <QueueFilters filters={kycQueue.filters} values={values} />
        <QueueList basePath={kycQueue.basePath} columns={kycQueue.listColumns} items={result.items} />
        <Pagination page={result.page} pageCount={result.pageCount} values={values} />
      </main>
    </>
  );
}
