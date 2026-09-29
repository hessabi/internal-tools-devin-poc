import { z } from "zod";

export const ROLES = ["analyst", "manager", "admin"] as const;
export const RoleSchema = z.enum(ROLES);
export type Role = z.infer<typeof RoleSchema>;
