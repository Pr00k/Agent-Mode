export type ErrorCode =
  | "NetworkError"
  | "TimeoutError"
  | "ParseError"
  | "ProtocolError"
  | "AuthorizationError"
  | "ToolPermissionError"
  | "SecurityPolicyError"
  | "PlatformCapabilityError"
  | "UnknownError";

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly retryable: boolean;

  constructor(code: ErrorCode, message: string, retryable = false) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.retryable = retryable;
  }
}

export function toUserMessage(err: unknown, fallback: string): string {
  if (err instanceof AppError) {
    if (err.code === "TimeoutError") return fallback;
    if (err.code === "ToolPermissionError") return fallback;
  }
  return fallback;
}
