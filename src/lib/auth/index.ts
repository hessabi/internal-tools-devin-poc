import type { AuthProvider } from "@/lib/auth/provider";
import { DevAuthProvider } from "@/lib/auth/dev-provider";

export function getAuthProvider(): AuthProvider {
  return new DevAuthProvider();
}
