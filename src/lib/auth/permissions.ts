import type { Role } from "@/lib/config/roles";
import type { Session } from "@/lib/auth/provider";

export const PERMISSIONS = {
  viewKycQueue: ["analyst", "manager", "admin"],
  editNotes: ["analyst", "manager", "admin"],
  startReview: ["analyst", "manager", "admin"],
  approveKyc: ["analyst", "manager", "admin"],
  rejectKyc: ["analyst", "manager", "admin"],
  viewAuditLog: ["manager", "admin"],
} as const satisfies Record<string, readonly Role[]>;

export type Permission = keyof typeof PERMISSIONS;

export function can(session: Session, permission: Permission): boolean {
  return (PERMISSIONS[permission] as readonly Role[]).includes(session.role);
}
