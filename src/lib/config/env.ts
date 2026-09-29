import { z } from "zod";

const EnvSchema = z.object({
  DATABASE_URL: z.string().min(1),
  AUTH_DEV_LOGIN: z
    .string()
    .optional()
    .transform((value) => value === "true")
    .default(false),
  AUTH_COOKIE_SECRET: z.string().min(8),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
});

export type Env = z.infer<typeof EnvSchema>;

let cachedKey = "";
let cachedEnv: Env | undefined;

export function getEnv(): Env {
  const key = [
    process.env.DATABASE_URL ?? "",
    process.env.AUTH_DEV_LOGIN ?? "",
    process.env.AUTH_COOKIE_SECRET ?? "",
    process.env.NODE_ENV ?? "",
  ].join("\u0000");
  if (!cachedEnv || cachedKey !== key) {
    cachedEnv = EnvSchema.parse({
      DATABASE_URL: process.env.DATABASE_URL,
      AUTH_DEV_LOGIN: process.env.AUTH_DEV_LOGIN,
      AUTH_COOKIE_SECRET: process.env.AUTH_COOKIE_SECRET,
      NODE_ENV: process.env.NODE_ENV,
    });
    cachedKey = key;
  }
  return cachedEnv;
}

export const isDevLoginEnabled = (): boolean => {
  const current = getEnv();
  return current.AUTH_DEV_LOGIN && current.NODE_ENV !== "production";
};
