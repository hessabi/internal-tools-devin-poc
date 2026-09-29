import Link from "next/link";
import { redirect } from "next/navigation";
import { z } from "zod";
import { AppHeader } from "@/components/app-header";
import { Pagination } from "@/components/review-queue/pagination";
import { PageHeader } from "@/components/ui/page-header";
import { can } from "@/lib/auth/permissions";
import { requireSession } from "@/lib/auth/session";
import { AppError } from "@/lib/errors";
import { listAuditEntries } from "@/lib/audit/repository";
import { formatUtc } from "@/lib/format";
import { logError } from "@/lib/logger";

const changesSchema = z.object({
  before: z.record(z.string(), z.unknown()),
  after: z.record(z.string(), z.unknown()),
});

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function parseChanges(value: string): z.infer<typeof changesSchema> | null {
  try {
    return changesSchema.parse(JSON.parse(value));
  } catch {
    logError("audit_changes_invalid", { code: "VALIDATION" });
    return null;
  }
}

function displayValue(value: unknown): string {
  if (value === undefined) {
    return "empty";
  }
  if (typeof value === "string") {
    return value;
  }
  return JSON.stringify(value);
}

export default async function AuditPage({
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
  if (!can(session, "viewAuditLog")) {
    return (
      <>
        <AppHeader session={session} />
        <main className="mx-auto max-w-6xl px-6 py-10">
          <div className="rounded border border-red-200 bg-red-50 p-6 text-red-900">
            <h1 className="text-xl font-semibold">403. Access denied</h1>
            <p className="mt-2">Your role cannot view the audit log.</p>
          </div>
        </main>
      </>
    );
  }
  const values = await searchParams;
  const pageSchema = z.coerce.number().int().min(1).default(1);
  const pageValue = pageSchema.safeParse(values.page);
  const result = await listAuditEntries({
    page: pageValue.success ? pageValue.data : 1,
  });
  return (
    <>
      <AppHeader session={session} />
      <main className="mx-auto max-w-6xl space-y-6 px-6 py-10">
        <PageHeader
          title="Audit log"
          description="Immutable activity entries for internal tools."
        />
        <div className="overflow-x-auto rounded border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3">Actor</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Entity</th>
                <th className="px-4 py-3">Comment</th>
                <th className="px-4 py-3">Changes</th>
              </tr>
            </thead>
            <tbody>
              {result.items.map((entry) => {
                const changes = parseChanges(entry.changes);
                const changedKeys = changes
                  ? Object.keys(changes.after).concat(
                      Object.keys(changes.before).filter(
                        (key) => !(key in changes.after),
                      ),
                    )
                  : [];
                return (
                  <tr className="border-t border-slate-200 align-top" key={entry.id}>
                    <td className="whitespace-nowrap px-4 py-3">{formatUtc(entry.createdAt)}</td>
                    <td className="px-4 py-3">
                      {entry.actor.name}
                      <span className="block text-xs text-slate-500">{entry.actor.role}</span>
                    </td>
                    <td className="px-4 py-3">{entry.action}</td>
                    <td className="px-4 py-3">
                      {entry.entityType === "kyc_case" ? (
                        <Link className="text-blue-700 hover:underline" href={`/kyc/${entry.entityId}`}>
                          {entry.entityType}/{entry.entityId}
                        </Link>
                      ) : (
                        `${entry.entityType}/${entry.entityId}`
                      )}
                    </td>
                    <td className="max-w-xs px-4 py-3">{entry.comment ?? ""}</td>
                    <td className="px-4 py-3">
                      {changes ? (
                        <ul className="space-y-1">
                          {changedKeys.map((key) => (
                            <li key={key}>
                              <span className="font-medium">{key}</span>:{" "}
                              {displayValue(changes.before[key])} {"->"}{" "}
                              {displayValue(changes.after[key])}
                            </li>
                          ))}
                        </ul>
                      ) : "Unavailable"}
                    </td>
                  </tr>
                );
              })}
              {result.items.length === 0 ? (
                <tr>
                  <td className="px-4 py-8 text-center text-slate-500" colSpan={6}>
                    No audit entries yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        <Pagination
          page={result.page}
          pageCount={result.pageCount}
          values={{ page: String(result.page) }}
        />
      </main>
    </>
  );
}
