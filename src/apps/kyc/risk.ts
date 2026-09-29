import { z } from "zod";

export const RISK_LEVELS = ["low", "medium", "high"] as const;
export const RiskLevelSchema = z.enum(RISK_LEVELS);
export type RiskLevel = z.infer<typeof RiskLevelSchema>;
