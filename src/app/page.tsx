import Link from "next/link";
import { redirect } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { can } from "@/lib/auth/permissions";
import { requireSession } from "@/lib/auth/session";
import { AppError } from "@/lib/errors";

export default async function Home() {
  let session;
  try {
    session = await requireSession();
  } catch (error: unknown) {
    if (error instanceof AppError && error.code === "UNAUTHENTICATED") {
      redirect("/sign-in");
    }
    throw error;
  }
  return (
    <>
      <AppHeader session={session} />
      <main className="mx-auto max-w-6xl px-6 py-10">
        <h1 className="text-3xl font-semibold">Internal Tools Foundation</h1>
        <p className="mt-3 text-slate-600">
          Synthetic internal review tools built on a shared foundation.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <Link className="rounded border border-slate-200 bg-white p-5 hover:border-slate-400" href="/kyc">
            <h2 className="font-semibold">KYC review queue</h2>
            <p className="mt-1 text-sm text-slate-600">Review synthetic customer cases.</p>
          </Link>
          {can(session, "viewAuditLog") ? (
            <Link className="rounded border border-slate-200 bg-white p-5 hover:border-slate-400" href="/audit">
              <h2 className="font-semibold">Audit log</h2>
              <p className="mt-1 text-sm text-slate-600">Review immutable activity entries.</p>
            </Link>
          ) : null}
        </div>
      </main>
    </>
  );
}
