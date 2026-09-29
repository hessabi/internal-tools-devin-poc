import { z } from "zod";

export type AppErrorCode =
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION"
  | "INVALID_TRANSITION"
  | "COMMENT_REQUIRED"
  | "SELF_APPROVAL"
  | "AUDIT_IMMUTABLE"
  | "DEV_LOGIN_DISABLED";

const statusByCode: Record<AppErrorCode, number> = {
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  VALIDATION: 400,
  INVALID_TRANSITION: 409,
  COMMENT_REQUIRED: 400,
  SELF_APPROVAL: 403,
  AUDIT_IMMUTABLE: 409,
  DEV_LOGIN_DISABLED: 403,
};

export class AppError extends Error {
  readonly code: AppErrorCode;
  readonly status: number;

  constructor(code: AppErrorCode, message: string) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.status = statusByCode[code];
  }

  static fromZod(error: z.ZodError): AppError {
    return new AppError("VALIDATION", error.issues[0]?.message ?? "Invalid input");
  }
}

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; code: AppErrorCode; message: string };

export function toActionResult<T>(error: unknown): ActionResult<T> {
  if (error instanceof AppError) {
    return { ok: false, code: error.code, message: error.message };
  }
  return {
    ok: false,
    code: "VALIDATION",
    message: "The request could not be completed",
  };
}
