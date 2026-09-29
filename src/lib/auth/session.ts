import { AppError } from "@/lib/errors";
import { getAuthProvider } from "@/lib/auth";
import type { Session } from "@/lib/auth/provider";
import type { Role } from "@/lib/config/roles";

export async function requireSession(): Promise<Session> {
  const session = await getAuthProvider().getSession();
  if (!session) {
    throw new AppError("UNAUTHENTICATED", "Sign-in is required");
  }
  return session;
}

export function requireRole(
  session: Session,
  roles: readonly Role[],
): Session {
  if (!roles.includes(session.role)) {
    throw new AppError("FORBIDDEN", "You do not have permission for this action");
  }
  return session;
}
