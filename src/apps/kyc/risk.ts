import { z } from "zod";
import type { BadgeTone } from "@/components/ui/badge";

export const RISK_LEVELS = ["low", "medium", "high"] as const;
export const RiskLevelSchema = z.enum(RISK_LEVELS);
export type RiskLevel = z.infer<typeof RiskLevelSchema>;

export const RISK_LEVEL_LABELS: Record<RiskLevel, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

export const RISK_LEVEL_TONES: Record<RiskLevel, BadgeTone> = {
  low: "green",
  medium: "amber",
  high: "red",
};
