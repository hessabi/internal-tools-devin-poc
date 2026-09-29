import { prisma } from "@/lib/db";
import { isDevLoginEnabled } from "@/lib/config/env";
import { SignInForm } from "@/app/sign-in/sign-in-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function SignInPage() {
  const users = await prisma.user.findMany({ orderBy: { name: "asc" } });
  const enabled = isDevLoginEnabled();
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">
            <h1>Sign in to Internal Tools</h1>
          </CardTitle>
          <CardDescription>Use your company account to continue.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Button className="w-full" disabled size="lg" type="button">
              Sign in with Microsoft
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Production sign-in: Microsoft Entra ID through the AuthProvider interface. Not
              configured in this prototype.
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground uppercase">
            <span className="h-px flex-1 bg-border" />
            Development bypass
            <span className="h-px flex-1 bg-border" />
          </div>
          {enabled ? (
            <div className="space-y-2">
              <p className="text-center text-xs text-muted-foreground">
                Sign in as a seeded synthetic user.
              </p>
              {users.map((user) => (
                <SignInForm key={user.id} userId={user.id}>
                  <span className="font-medium">{user.name}</span>
                  <Badge variant="secondary">{user.role}</Badge>
                </SignInForm>
              ))}
            </div>
          ) : (
            <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-amber-900">
              Development sign-in is disabled. Set AUTH_DEV_LOGIN=true outside production.
            </p>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
