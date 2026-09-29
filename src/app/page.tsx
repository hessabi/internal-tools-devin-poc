import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { can } from "@/lib/auth/permissions";
import { requirePageSession } from "@/lib/auth/session";
import { reviewQueues } from "@/apps/registry";

const cardLinkClass = "rounded-xl transition-shadow hover:shadow-md focus-visible:outline-2";

export default async function Home() {
  const session = await requirePageSession();
  return (
    <>
      <AppHeader session={session} />
      <main className="mx-auto max-w-6xl space-y-6 px-6 py-8">
        <PageHeader
          title="Internal Tools Foundation"
          description="Synthetic internal review tools built on a shared foundation."
        />
        <div className="grid gap-4 sm:grid-cols-2">
          {reviewQueues.map((queue) => (
            <Link className={cardLinkClass} href={queue.basePath} key={queue.key}>
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>{queue.title}</CardTitle>
                  <CardDescription>{queue.description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
          {can(session, "viewAuditLog") ? (
            <Link className={cardLinkClass} href="/audit">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>Audit log</CardTitle>
                  <CardDescription>Review immutable activity entries.</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ) : null}
        </div>
      </main>
    </>
  );
}
