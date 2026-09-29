import Link from "next/link";
import { signOutAction } from "@/app/actions";
import { NavLink } from "@/components/nav-link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { can } from "@/lib/auth/permissions";
import type { Session } from "@/lib/auth/provider";
import { reviewQueues } from "@/apps/registry";

export function AppHeader({ session }: { session: Session }) {
  return (
    <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-3 sm:px-6">
        <div className="flex min-w-0 flex-wrap items-center gap-x-6 gap-y-2">
          <Link className="text-sm font-semibold tracking-tight" href="/">
            Internal Tools
          </Link>
          <nav className="flex flex-wrap items-center gap-1">
            {reviewQueues.map((queue) => (
              <NavLink href={queue.basePath} key={queue.key} label={queue.title} />
            ))}
            {can(session, "viewAuditLog") ? <NavLink href="/audit" label="Audit log" /> : null}
          </nav>
        </div>
        <div className="flex min-w-0 items-center gap-3 text-sm">
          <span className="truncate font-medium">{session.name}</span>
          <Badge variant="secondary">{session.role}</Badge>
          <form action={async () => { "use server"; await signOutAction(); }}>
            <Button size="sm" type="submit" variant="outline">
              Sign out
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
