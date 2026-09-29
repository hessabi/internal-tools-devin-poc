import type { Role } from "@/lib/config/roles";

export type Session = {
  userId: string;
  email: string;
  name: string;
  role: Role;
};

export interface AuthProvider {
  getSession(): Promise<Session | null>;
  signIn(input: unknown): Promise<Session>;
  signOut(): Promise<void>;
}
