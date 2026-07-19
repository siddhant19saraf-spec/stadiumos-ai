export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  timestamp: string;
  correlationId?: string;
  pagination?: PaginationInfo;
}

export interface PaginationInfo {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface ApiError {
  success: false;
  error: string;
  message: string;
  statusCode: number;
  timestamp: string;
  correlationId?: string;
  details?: Record<string, string[]>;
}

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
