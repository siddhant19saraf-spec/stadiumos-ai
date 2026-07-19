import { AppError, ErrorCode } from "./error-handler";
import { getApiUrl } from "./url";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface ApiConfig {
  baseUrl: string;
  timeout: number;
  headers: Record<string, string>;
}

interface ApiResponse<T> {
  data: T;
  status: number;
  message: string;
  timestamp: string;
  correlationId?: string;
}

interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

type RequestInterceptor = (config: RequestInit & { url: string }) => RequestInit & { url: string };
type ResponseInterceptor = <T>(response: ApiResponse<T>) => ApiResponse<T>;

const defaultConfig: ApiConfig = {
  baseUrl: getApiUrl(),
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
};

class ApiClient {
  private config: ApiConfig;
  private requestInterceptors: RequestInterceptor[] = [];
  private responseInterceptors: ResponseInterceptor[] = [];

  constructor(config: Partial<ApiConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  addRequestInterceptor(interceptor: RequestInterceptor): void {
    this.requestInterceptors.push(interceptor);
  }

  addResponseInterceptor(interceptor: ResponseInterceptor): void {
    this.responseInterceptors.push(interceptor);
  }

  private async getAccessToken(): Promise<string | null> {
    try {
      const { getSession } = await import("next-auth/react");
      const session = await getSession();
      return (session as { accessToken?: string } | null)?.accessToken ?? null;
    } catch {
      return null;
    }
  }

  private async request<T>(
    method: HttpMethod,
    path: string,
    body?: unknown,
    options: Partial<RequestInit> = {},
  ): Promise<ApiResponse<T>> {
    const url = `${this.config.baseUrl}${path}`;
    const token = await this.getAccessToken();

    const headers: Record<string, string> = {
      ...this.config.headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    if (body instanceof FormData) {
      delete headers["Content-Type"];
    }

    let requestConfig: RequestInit & { url: string } = {
      url,
      method,
      headers,
      body: body && !(body instanceof FormData) ? JSON.stringify(body) : (body as BodyInit | undefined),
      signal: AbortSignal.timeout(this.config.timeout),
      ...options,
    };

    for (const interceptor of this.requestInterceptors) {
      requestConfig = interceptor(requestConfig);
    }

    try {
      const response = await fetch(requestConfig.url, requestConfig);
      const json = (await response.json()) as ApiResponse<T>;

      if (!response.ok) {
        throw new AppError(
          json.message ?? `Request failed with status ${response.status}`,
          this.mapHttpStatusToErrorCode(response.status),
          response.status,
          json.correlationId,
        );
      }

      let result = json;
      for (const interceptor of this.responseInterceptors) {
        result = interceptor(result);
      }

      return result;
    } catch (error) {
      if (error instanceof AppError) throw error;

      if (error instanceof DOMException && error.name === "AbortError") {
        throw new AppError("Request timed out", ErrorCode.TIMEOUT, 408);
      }

      if (error instanceof TypeError && error.message === "Failed to fetch") {
        throw new AppError("Network error - unable to connect to server", ErrorCode.NETWORK_ERROR, 0);
      }

      throw new AppError(
        "An unexpected error occurred",
        ErrorCode.UNKNOWN,
        500,
      );
    }
  }

  private mapHttpStatusToErrorCode(status: number): ErrorCode {
    switch (status) {
      case 400: return ErrorCode.VALIDATION;
      case 401: return ErrorCode.UNAUTHORIZED;
      case 403: return ErrorCode.FORBIDDEN;
      case 404: return ErrorCode.NOT_FOUND;
      case 409: return ErrorCode.CONFLICT;
      case 422: return ErrorCode.VALIDATION;
      case 429: return ErrorCode.RATE_LIMITED;
      case 500: return ErrorCode.INTERNAL;
      case 503: return ErrorCode.SERVICE_UNAVAILABLE;
      default: return ErrorCode.UNKNOWN;
    }
  }

  async get<T>(path: string, options?: Partial<RequestInit>): Promise<ApiResponse<T>> {
    return this.request<T>("GET", path, undefined, options);
  }

  async post<T>(path: string, body?: unknown, options?: Partial<RequestInit>): Promise<ApiResponse<T>> {
    return this.request<T>("POST", path, body, options);
  }

  async put<T>(path: string, body?: unknown, options?: Partial<RequestInit>): Promise<ApiResponse<T>> {
    return this.request<T>("PUT", path, body, options);
  }

  async patch<T>(path: string, body?: unknown, options?: Partial<RequestInit>): Promise<ApiResponse<T>> {
    return this.request<T>("PATCH", path, body, options);
  }

  async delete<T>(path: string, options?: Partial<RequestInit>): Promise<ApiResponse<T>> {
    return this.request<T>("DELETE", path, undefined, options);
  }

  async getPaginated<T>(
    path: string,
    page = 1,
    pageSize = 20,
    options?: Partial<RequestInit>,
  ): Promise<PaginatedResponse<T>> {
    const separator = path.includes("?") ? "&" : "?";
    const response = await this.get<PaginatedResponse<T>>(
      `${path}${separator}page=${page}&pageSize=${pageSize}`,
      options,
    );
    return response.data;
  }
}

export const apiClient = new ApiClient();

export type { ApiConfig, ApiResponse, PaginatedResponse, HttpMethod };
