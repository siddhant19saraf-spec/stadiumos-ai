import type { ApiResponse, ApiError, PaginationInfo } from "@/types/api";
export type { ApiResponse };

export function isApiError<T>(response: ApiResponse<T> | ApiError): response is ApiError {
  return !response.success;
}

export function buildSuccessResponse<T>(
  data: T,
  message = "Success",
  correlationId?: string,
  pagination?: PaginationInfo,
): ApiResponse<T> {
  return {
    success: true,
    data,
    message,
    timestamp: new Date().toISOString(),
    correlationId,
    pagination,
  };
}

export function buildErrorResponse(
  error: string,
  message: string,
  statusCode: number,
  correlationId?: string,
  details?: Record<string, string[]>,
): ApiError {
  return {
    success: false,
    error,
    message,
    statusCode,
    timestamp: new Date().toISOString(),
    correlationId,
    details,
  };
}
