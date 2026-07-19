export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  timestamp: string;
  correlationId?: string;
  pagination?: PaginationInfo;
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

export interface PaginationInfo {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface PaginatedParams {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}
