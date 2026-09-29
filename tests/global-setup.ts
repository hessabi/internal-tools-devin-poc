import { execSync } from "node:child_process";

export default function globalSetup(): void {
  process.env.DATABASE_URL = "file:./test.db";
  process.env.AUTH_DEV_LOGIN = "true";
  process.env.AUTH_COOKIE_SECRET = "test-secret-only";
  Reflect.set(process.env, "NODE_ENV", "test");
  execSync("npx prisma db push --force-reset --skip-generate", {
    stdio: "inherit",
    env: process.env,
  });
}
