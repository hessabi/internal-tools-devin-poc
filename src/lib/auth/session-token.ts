import { createHmac, timingSafeEqual } from "node:crypto";

function signature(userId: string, secret: string): string {
  return createHmac("sha256", secret).update(userId).digest("hex");
}

export function encodeSessionToken(userId: string, secret: string): string {
  return `${userId}.${signature(userId, secret)}`;
}

export function verifySessionToken(
  token: string,
  secret: string,
): string | null {
  const separator = token.lastIndexOf(".");
  if (separator <= 0 || separator === token.length - 1) {
    return null;
  }
  const userId = token.slice(0, separator);
  const provided = token.slice(separator + 1);
  const expected = signature(userId, secret);
  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(expected);
  if (
    providedBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(providedBuffer, expectedBuffer)
  ) {
    return null;
  }
  return userId;
}
