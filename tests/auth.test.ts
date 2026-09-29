import { describe, expect, it, vi } from "vitest";
import { DevAuthProvider } from "@/lib/auth/dev-provider";
import {
  encodeSessionToken,
  verifySessionToken,
} from "@/lib/auth/session-token";

describe("authentication", () => {
  it("rejects development sign-in in production before cookies", async () => {
    vi.stubEnv("NODE_ENV", "production");
    await expect(
      new DevAuthProvider().signIn({ userId: "missing-user" }),
    ).rejects.toMatchObject({ code: "DEV_LOGIN_DISABLED" });
    vi.unstubAllEnvs();
  });

  it("accepts valid session tokens and rejects tampering", () => {
    const token = encodeSessionToken("user-id", "test-secret-only");
    expect(verifySessionToken(token, "test-secret-only")).toBe("user-id");
    expect(verifySessionToken(`${token}x`, "test-secret-only")).toBeNull();
    expect(verifySessionToken(token, "wrong-secret")).toBeNull();
  });
});
