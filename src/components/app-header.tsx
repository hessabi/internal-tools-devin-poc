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
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-6 px-6">
        <div className="flex items-center gap-6">
          <Link className="text-sm font-semibold tracking-tight" href="/">
            Internal Tools
          </Link>
          <nav className="flex items-center gap-1">
            {reviewQueues.map((queue) => (
              <NavLink href={queue.basePath} key={queue.key} label={queue.title} />
            ))}
            {can(session, "viewAuditLog") ? <NavLink href="/audit" label="Audit log" /> : null}
          </nav>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="font-medium">{session.name}</span>
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
