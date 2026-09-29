import { cookies } from "next/headers";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { getEnv, isDevLoginEnabled } from "@/lib/config/env";
import { RoleSchema } from "@/lib/config/roles";
import type { AuthProvider, Session } from "@/lib/auth/provider";
import {
  encodeSessionToken,
  verifySessionToken,
} from "@/lib/auth/session-token";

const inputSchema = z.object({ userId: z.string().min(1) });
const cookieName = "it_session";

export class DevAuthProvider implements AuthProvider {
  async getSession(): Promise<Session | null> {
    const token = (await cookies()).get(cookieName)?.value;
    if (!token) {
      return null;
    }
    const userId = verifySessionToken(token, getEnv().AUTH_COOKIE_SECRET);
    if (!userId) {
      return null;
    }
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return null;
    }
    const role = RoleSchema.safeParse(user.role);
    if (!role.success) {
      return null;
    }
    return { userId: user.id, email: user.email, name: user.name, role: role.data };
  }

  async signIn(input: unknown): Promise<Session> {
    if (!isDevLoginEnabled()) {
      throw new AppError("DEV_LOGIN_DISABLED", "Development sign-in is disabled");
    }
    const parsed = inputSchema.safeParse(input);
    if (!parsed.success) {
      throw AppError.fromZod(parsed.error);
    }
    const user = await prisma.user.findUnique({
      where: { id: parsed.data.userId },
    });
    if (!user) {
      throw new AppError("NOT_FOUND", "User not found");
    }
    const role = RoleSchema.safeParse(user.role);
    if (!role.success) {
      throw new AppError("VALIDATION", "User role is invalid");
    }
    (await cookies()).set(cookieName, encodeSessionToken(user.id, getEnv().AUTH_COOKIE_SECRET), {
      httpOnly: true,
      sameSite: "lax",
      secure: getEnv().NODE_ENV === "production",
      path: "/",
    });
    return { userId: user.id, email: user.email, name: user.name, role: role.data };
  }

  async signOut(): Promise<void> {
    (await cookies()).delete(cookieName);
  }
}
