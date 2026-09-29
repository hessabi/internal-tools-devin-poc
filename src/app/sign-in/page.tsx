import { prisma } from "@/lib/db";
import { isDevLoginEnabled } from "@/lib/config/env";
import { SignInForm } from "@/app/sign-in/sign-in-form";

export default async function SignInPage() {
  const users = await prisma.user.findMany({ orderBy: { name: "asc" } });
  const enabled = isDevLoginEnabled();
  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-semibold">Sign in</h1>
      <p className="mt-2 text-slate-600">
        Choose a seeded synthetic user for local development.
      </p>
      {!enabled ? (
        <p className="mt-6 rounded border border-amber-300 bg-amber-50 p-4 text-amber-900">
          Development sign-in is disabled. Set AUTH_DEV_LOGIN=true outside production.
        </p>
      ) : null}
      <div className="mt-8 overflow-hidden rounded border border-slate-200 bg-white">
        {users.map((user) => (
          <div
            className="flex items-center justify-between border-b border-slate-200 px-5 py-4 last:border-b-0"
            key={user.id}
          >
            <div>
              <p className="font-medium">{user.name}</p>
              <p className="text-sm text-slate-500">
                {user.email} | {user.role}
              </p>
            </div>
            {enabled ? <SignInForm userId={user.id} /> : null}
          </div>
        ))}
      </div>
    </main>
  );
}
