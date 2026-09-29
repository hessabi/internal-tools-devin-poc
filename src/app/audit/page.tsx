import Link from "next/link";
import { z } from "zod";
import { AppHeader } from "@/components/app-header";
import { Pagination } from "@/components/review-queue/pagination";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/ui/page-header";
import { can } from "@/lib/auth/permissions";
import { requirePageSession } from "@/lib/auth/session";
import { listAuditEntries } from "@/lib/audit/repository";
import { formatUtc } from "@/lib/format";
import { logError } from "@/lib/logger";
import { queueForEntityType } from "@/apps/registry";

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
  const session = await requirePageSession();
  if (!can(session, "viewAuditLog")) {
    return (
      <>
        <AppHeader session={session} />
        <main className="mx-auto max-w-6xl px-6 py-8">
          <Card className="ring-destructive/30">
            <CardHeader>
              <CardTitle className="text-lg text-destructive">
                <h1>403. Access denied</h1>
              </CardTitle>
              <CardDescription>Your role cannot view the audit log.</CardDescription>
            </CardHeader>
          </Card>
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
      <main className="mx-auto max-w-6xl space-y-6 px-6 py-8">
        <PageHeader
          title="Audit log"
          description="Immutable activity entries for internal tools."
        />
        <Card className="py-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="px-4">Time</TableHead>
                <TableHead className="px-4">Actor</TableHead>
                <TableHead className="px-4">Action</TableHead>
                <TableHead className="px-4">Entity</TableHead>
                <TableHead className="px-4">Comment</TableHead>
                <TableHead className="px-4">Changes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.items.map((entry) => {
                const changes = parseChanges(entry.changes);
                const queue = queueForEntityType(entry.entityType);
                const changedKeys = changes
                  ? Object.keys(changes.after).concat(
                      Object.keys(changes.before).filter(
                        (key) => !(key in changes.after),
                      ),
                    )
                  : [];
                return (
                  <TableRow className="align-top" key={entry.id}>
                    <TableCell className="px-4 py-3">{formatUtc(entry.createdAt)}</TableCell>
                    <TableCell className="px-4 py-3 whitespace-normal">
                      {entry.actor.name}
                      <span className="block text-xs text-muted-foreground">{entry.actor.role}</span>
                    </TableCell>
                    <TableCell className="px-4 py-3 whitespace-normal">{entry.action}</TableCell>
                    <TableCell className="px-4 py-3 whitespace-normal">
                      {queue ? (
                        <Link className="font-mono text-xs text-blue-700 hover:underline" href={`${queue.basePath}/${entry.entityId}`}>
                          {entry.entityType}/{entry.entityId}
                        </Link>
                      ) : (
                        `${entry.entityType}/${entry.entityId}`
                      )}
                    </TableCell>
                    <TableCell className="max-w-xs px-4 py-3 whitespace-normal">{entry.comment ?? ""}</TableCell>
                    <TableCell className="px-4 py-3 whitespace-normal">
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
                    </TableCell>
                  </TableRow>
                );
              })}
              {result.items.length === 0 ? (
                <TableRow>
                  <TableCell className="py-8 text-center text-muted-foreground" colSpan={6}>
                    No audit entries yet.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </Card>
        <Pagination
          page={result.page}
          pageCount={result.pageCount}
          values={{ page: String(result.page) }}
        />
      </main>
    </>
  );
}
