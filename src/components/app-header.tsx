import Link from "next/link";
import { signOutAction } from "@/app/actions";
import type { Session } from "@/lib/auth/provider";

export function AppHeader({ session }: { session: Session }) {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <nav className="flex items-center gap-5">
          <Link className="font-semibold" href="/">
            Internal Tools
          </Link>
          <Link className="text-sm text-slate-600 hover:text-slate-900" href="/kyc">
            KYC queue
          </Link>
        </nav>
        <div className="flex items-center gap-4 text-sm">
          <span>
            {session.name} <span className="text-slate-500">({session.role})</span>
          </span>
          <form action={signOutAction}>
            <button className="rounded border border-slate-300 px-3 py-1.5 hover:bg-slate-50" type="submit">
              Sign out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
