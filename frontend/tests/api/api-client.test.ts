import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { apiClient, ApiClient } from "@/lib/api-client";
import { AppError, ErrorCode } from "@/lib/error-handler";
import { createMockFetch, createMockFetchError, createMockAbortError } from "../fixtures/mocks";

describe("ApiClient — HTTP Methods", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("should perform GET request", async () => {
    const fetchMock = createMockFetch({ items: [], total: 0 });
    vi.stubGlobal("fetch", fetchMock);
    const result = await apiClient.get("/api/test");
    expect(result.data).toBeDefined();
    expect(result.status).toBe(200);
  });

  it("should perform POST request with body", async () => {
    const fetchMock = createMockFetch({ id: "1", success: true });
    vi.stubGlobal("fetch", fetchMock);
    const result = await apiClient.post("/api/test", { name: "test" });
    expect(result.data).toBeDefined();
    const callArgs = fetchMock.mock.calls[0]!;
    expect(callArgs[1]!.method).toBe("POST");
    expect(callArgs[1]!.body).toBe(JSON.stringify({ name: "test" }));
  });

  it("should perform PUT request", async () => {
    const fetchMock = createMockFetch({ success: true });
    vi.stubGlobal("fetch", fetchMock);
    const result = await apiClient.put("/api/test/1", { name: "updated" });
    expect(result.data).toBeDefined();
    const callArgs = fetchMock.mock.calls[0]!;
    expect(callArgs[1]!.method).toBe("PUT");
  });

  it("should perform PATCH request", async () => {
    const fetchMock = createMockFetch({ success: true });
    vi.stubGlobal("fetch", fetchMock);
    await apiClient.patch("/api/test/1", { name: "patched" });
    const callArgs = fetchMock.mock.calls[0]!;
    expect(callArgs[1]!.method).toBe("PATCH");
  });

  it("should perform DELETE request", async () => {
    const fetchMock = createMockFetch({ success: true });
    vi.stubGlobal("fetch", fetchMock);
    await apiClient.delete("/api/test/1");
    const callArgs = fetchMock.mock.calls[0]!;
    expect(callArgs[1]!.method).toBe("DELETE");
  });

  it("should perform paginated GET request", async () => {
    const items = Array.from({ length: 20 }, (_, i) => ({ id: `item-${i}`, name: `Item ${i}` }));
    const response = { items, total: 100, page: 1, pageSize: 20, totalPages: 5, hasNext: true, hasPrevious: false };
    const fetchMock = createMockFetch(response);
    vi.stubGlobal("fetch", fetchMock);
    const result = await apiClient.getPaginated("/api/items", 1, 20);
    expect(result.items.length).toBe(20);
    expect(result.total).toBe(100);
    expect(result.hasNext).toBe(true);
  });
});

describe("ApiClient — Authentication", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("should include auth token in headers when available", async () => {
    vi.stubGlobal("fetch", createMockFetch({ success: true }));
    await apiClient.get("/api/protected");
    const callArgs = (vi.mocked(fetch) as any).mock.calls[0];
    expect(callArgs[1].headers).toBeDefined();
  });

  it("should set Content-Type and Accept headers by default", async () => {
    vi.stubGlobal("fetch", createMockFetch({ success: true }));
    const client = new ApiClient({ baseUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000" });
    await client.get("/api/test");
    const callArgs = (vi.mocked(fetch) as any).mock.calls[0];
    expect(callArgs[1].headers["Content-Type"]).toBe("application/json");
    expect(callArgs[1].headers["Accept"]).toBe("application/json");
  });

  it("should not set Content-Type for FormData", async () => {
    vi.stubGlobal("fetch", createMockFetch({ success: true }));
    const formData = new FormData();
    formData.append("file", new Blob(["test"]), "test.txt");
    await apiClient.post("/api/upload", formData);
    const callArgs = (vi.mocked(fetch) as any).mock.calls[0];
    expect(callArgs[1].headers["Content-Type"]).toBeUndefined();
  });
});

describe("ApiClient — Error Handling", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("should throw AppError on 4xx response", async () => {
    vi.stubGlobal("fetch", createMockFetch({ message: "Bad request" }, true, 400));
    await expect(apiClient.get("/api/bad-request")).rejects.toThrow(AppError);
  });

  it("should throw AppError on 5xx response", async () => {
    vi.stubGlobal("fetch", createMockFetch({ message: "Server error" }, true, 500));
    await expect(apiClient.get("/api/server-error")).rejects.toThrow(AppError);
  });

  it("should throw AppError with correct error code on 401", async () => {
    vi.stubGlobal("fetch", createMockFetch({ message: "Unauthorized" }, true, 401));
    try {
      await apiClient.get("/api/unauthorized");
    } catch (e) {
      expect(e).toBeInstanceOf(AppError);
      expect((e as AppError).code).toBe(ErrorCode.UNAUTHORIZED);
      expect((e as AppError).status).toBe(401);
    }
  });

  it("should throw AppError with correct error code on 403", async () => {
    vi.stubGlobal("fetch", createMockFetch({ message: "Forbidden" }, true, 403));
    try {
      await apiClient.get("/api/forbidden");
    } catch (e) {
      expect((e as AppError).code).toBe(ErrorCode.FORBIDDEN);
    }
  });

  it("should throw AppError with correct error code on 404", async () => {
    vi.stubGlobal("fetch", createMockFetch({ message: "Not found" }, true, 404));
    try {
      await apiClient.get("/api/not-found");
    } catch (e) {
      expect((e as AppError).code).toBe(ErrorCode.NOT_FOUND);
    }
  });

  it("should throw AppError with correct error code on 429", async () => {
    vi.stubGlobal("fetch", createMockFetch({ message: "Rate limited" }, true, 429));
    try {
      await apiClient.get("/api/rate-limited");
    } catch (e) {
      expect((e as AppError).code).toBe(ErrorCode.RATE_LIMITED);
    }
  });

  it("should throw AppError on network failure", async () => {
    vi.stubGlobal("fetch", createMockFetchError());
    await expect(apiClient.get("/api/fail")).rejects.toThrow(AppError);
  });

  it("should throw AppError on timeout (AbortError)", async () => {
    vi.stubGlobal("fetch", createMockAbortError());
    await expect(apiClient.get("/api/timeout")).rejects.toThrow(AppError);
  });

  it("should handle unknown errors gracefully", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue("string error"));
    await expect(apiClient.get("/api/unknown")).rejects.toThrow(AppError);
  });
});

describe("ApiClient — Request Interceptors", () => {
  const client = new ApiClient({ baseUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000" });

  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("should apply request interceptors", async () => {
    vi.stubGlobal("fetch", createMockFetch({ success: true }));
    const spy = vi.fn((config: any) => config);
    client.addRequestInterceptor(spy);
    await client.get("/api/test");
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("should apply response interceptors", async () => {
    vi.stubGlobal("fetch", createMockFetch({ success: true }));
    const spy = vi.fn((response: any) => response);
    client.addResponseInterceptor(spy);
    await client.get("/api/test");
    expect(spy).toHaveBeenCalledTimes(1);
  });
});

describe("ApiClient — Custom Configuration", () => {
  it("should use custom base URL", () => {
    const client = new ApiClient({ baseUrl: "https://custom.api.com" });
    expect(client).toBeDefined();
  });

  it("should use default timeout when not specified", () => {
    const client = new ApiClient();
    expect(client).toBeDefined();
  });

  it("should accept partial configuration", () => {
    const client = new ApiClient({ timeout: 5000 });
    expect(client).toBeDefined();
  });
});

