// @ts-nocheck
import { apiClient } from "@/lib/api-client";
import type { ApiResponse } from "@/lib/response-wrapper";
import { logger } from "@/lib/logger";

const authLogger = logger.child("auth-service");

interface LoginRequest {
  email: string;
  password: string;
}

interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  role?: string;
}

interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
  accessToken: string;
  refreshToken: string;
}

interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
}

export const authService = {
  async login(data: LoginRequest): Promise<ApiResponse<AuthResponse>> {
    authLogger.info("Login attempt", { email: data.email });
    return apiClient.post<AuthResponse>("/api/v1/auth/login", data);
  },

  async register(data: RegisterRequest): Promise<ApiResponse<AuthResponse>> {
    authLogger.info("Register attempt", { email: data.email });
    return apiClient.post<AuthResponse>("/api/v1/auth/register", data);
  },

  async logout(): Promise<void> {
    authLogger.info("Logout");
    try {
      await apiClient.post("/api/v1/auth/logout");
    } catch {
      // Logout is best-effort on the server
    }
  },

  async refreshToken(token: string): Promise<ApiResponse<{ accessToken: string }>> {
    return apiClient.post<{ accessToken: string }>("/api/v1/auth/refresh", {
      refreshToken: token,
    });
  },

  async getProfile(): Promise<ApiResponse<UserProfile>> {
    return apiClient.get<UserProfile>("/api/v1/auth/profile");
  },

  async updateProfile(data: Partial<UserProfile>): Promise<ApiResponse<UserProfile>> {
    return apiClient.patch<UserProfile>("/api/v1/auth/profile", data);
  },
};

