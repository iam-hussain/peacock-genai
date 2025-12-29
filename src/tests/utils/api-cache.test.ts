import { beforeEach, describe, expect, it } from "vitest";

import {
  clearCache,
  getCachedResponse,
  getCacheStats,
  setCachedResponse,
} from "@/utils/api-cache";

describe("API Cache", () => {
  beforeEach(() => {
    clearCache();
  });

  it("should cache and retrieve responses", () => {
    const endpoint = "/api/test";
    const data = { message: "test" };

    setCachedResponse(endpoint, data);
    const cached = getCachedResponse<typeof data>(endpoint);

    expect(cached).toEqual(data);
  });

  it("should return null for uncached endpoints", () => {
    const cached = getCachedResponse("/api/uncached");
    expect(cached).toBeNull();
  });

  it("should clear all cache", () => {
    setCachedResponse("/api/test1", { data: 1 });
    setCachedResponse("/api/test2", { data: 2 });

    expect(getCacheStats().size).toBe(2);

    clearCache();

    expect(getCacheStats().size).toBe(0);
  });

  it("should generate different cache keys for different methods", () => {
    const endpoint = "/api/test";
    const data1 = { method: "GET" };
    const data2 = { method: "POST" };

    setCachedResponse(endpoint, data1, { method: "GET" });
    setCachedResponse(endpoint, data2, { method: "POST" });

    expect(getCachedResponse(endpoint, { method: "GET" })).toEqual(data1);
    expect(getCachedResponse(endpoint, { method: "POST" })).toEqual(data2);
  });
});
