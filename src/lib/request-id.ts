/**
 * Request ID Tracking
 * Generates unique request IDs for tracing and correlation
 */

/**
 * Generate a unique request ID
 */
export function generateRequestId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Set request ID for current context
 * Note: In Next.js, we use headers instead of context maps
 */
export function setRequestId(_id: string): void {
  // Store in a way that works with async operations
  // In Next.js, we'll use headers instead
}

/**
 * Get current request ID from headers
 */
export function getRequestIdFromHeaders(
  headers: Headers | Record<string, string>
): string {
  const headerValue =
    headers instanceof Headers
      ? headers.get("x-request-id")
      : headers["x-request-id"];

  return headerValue || generateRequestId();
}
