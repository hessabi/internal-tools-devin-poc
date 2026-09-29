import { prisma } from "@/lib/db";
import { isDevLoginEnabled } from "@/lib/config/env";
import { SignInForm } from "@/app/sign-in/sign-in-form";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function SignInPage() {
  const users = await prisma.user.findMany({ orderBy: { name: "asc" } });
  const enabled = isDevLoginEnabled();
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      <Card className="w-full max-w-xl">
        <CardHeader>
          <CardTitle className="text-xl">
            <h1>Sign in</h1>
          </CardTitle>
          <CardDescription>Choose a seeded synthetic user for local development.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!enabled ? (
            <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-amber-900">
              Development sign-in is disabled. Set AUTH_DEV_LOGIN=true outside production.
            </p>
          ) : null}
          <ul className="divide-y rounded-lg border">
            {users.map((user) => (
              <li className="flex items-center justify-between gap-4 px-4 py-3" key={user.id}>
                <div className="space-y-0.5">
                  <p className="font-medium">{user.name}</p>
                  <p className="flex items-center gap-2 text-muted-foreground">
                    {user.email}
                    <Badge variant="secondary">{user.role}</Badge>
                  </p>
                </div>
                {enabled ? <SignInForm userId={user.id} /> : null}
              </li>
            ))}
          </ul>
        </CardContent>
        <CardFooter>
          <p className="text-xs text-muted-foreground">
            Production sign-in: Microsoft Entra ID through the AuthProvider interface.
          </p>
        </CardFooter>
      </Card>
    </main>
  );
}
