export enum ErrorCode {
  VALIDATION = "VALIDATION_ERROR",
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",
  NOT_FOUND = "NOT_FOUND",
  CONFLICT = "CONFLICT",
  RATE_LIMITED = "RATE_LIMITED",
  INTERNAL = "INTERNAL_ERROR",
  SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE",
  TIMEOUT = "TIMEOUT",
  NETWORK_ERROR = "NETWORK_ERROR",
  UNKNOWN = "UNKNOWN_ERROR",
}

export interface ErrorPayload {
  code: ErrorCode;
  message: string;
  status: number;
  correlationId?: string;
  timestamp: string;
  details?: Record<string, string[]>;
}

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly status: number;
  public readonly correlationId?: string;
  public readonly details?: Record<string, string[]>;

  constructor(
    message: string,
    code: ErrorCode = ErrorCode.UNKNOWN,
    status = 500,
    correlationId?: string,
    details?: Record<string, string[]>,
  ) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.status = status;
    this.correlationId = correlationId;
    this.details = details;
  }

  toPayload(): ErrorPayload {
    return {
      code: this.code,
      message: this.message,
      status: this.status,
      correlationId: this.correlationId,
      timestamp: new Date().toISOString(),
      details: this.details,
    };
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export function getErrorMessage(error: unknown): string {
  if (isAppError(error)) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "An unexpected error occurred";
}

export function getErrorCode(error: unknown): ErrorCode {
  if (isAppError(error)) {
    return error.code;
  }
  return ErrorCode.UNKNOWN;
}
