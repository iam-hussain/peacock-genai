/**
 * API Response Cache
 * Caches API responses to avoid redundant calls to PEACOCK_API_URL
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  endpoint: string;
}

// In-memory cache storage
const cache = new Map<string, CacheEntry<unknown>>();

/**
 * Generate cache key from endpoint and options
 */
function generateCacheKey(
  endpoint: string,
  options?: { method?: string; body?: unknown }
): string {
  const method = options?.method || "GET";
  const bodyKey = options?.body ? JSON.stringify(options.body) : "";
  return `${method}:${endpoint}:${bodyKey}`;
}

/**
 * Get cached response if available
 */
export function getCachedResponse<T>(
  endpoint: string,
  options?: { method?: string; body?: unknown }
): T | null {
  const key = generateCacheKey(endpoint, options);
  const entry = cache.get(key);

  if (!entry) {
    return null;
  }

  return entry.data as T;
}

/**
 * Set cache entry
 */
export function setCachedResponse<T>(
  endpoint: string,
  data: T,
  options?: { method?: string; body?: unknown }
): void {
  const key = generateCacheKey(endpoint, options);
  cache.set(key, {
    data,
    timestamp: Date.now(),
    endpoint,
  });
}

/**
 * Clear all cached responses
 */
export function clearCache(): void {
  cache.clear();
}

/**
 * Clear cache for a specific endpoint pattern
 */
export function clearCacheForEndpoint(endpointPattern: string): void {
  const keysToDelete: string[] = [];

  for (const [key, entry] of cache.entries()) {
    if (entry.endpoint.includes(endpointPattern)) {
      keysToDelete.push(key);
    }
  }

  keysToDelete.forEach((key) => cache.delete(key));
}

/**
 * Get cache statistics
 */
export function getCacheStats(): {
  size: number;
  entries: Array<{ endpoint: string; timestamp: number }>;
} {
  const entries = Array.from(cache.values()).map((entry) => ({
    endpoint: entry.endpoint,
    timestamp: entry.timestamp,
  }));

  return {
    size: cache.size,
    entries,
  };
}
