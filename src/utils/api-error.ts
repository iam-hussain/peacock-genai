/**
 * API Error Utilities
 * Centralized error handling for Peacock API calls
 */

export interface ApiErrorInfo {
  message: string;
  endpoint: string;
  statusCode?: number;
  originalError?: unknown;
}

/**
 * Format API error for display
 */
export function formatApiError(error: unknown, endpoint: string): ApiErrorInfo {
  if (error instanceof Error) {
    // Check if it's a network error
    if (error.message.includes("fetch") || error.message.includes("network")) {
      return {
        message:
          "Unable to connect to Peacock API. Please check your internet connection and try again.",
        endpoint,
        originalError: error,
      };
    }

    // Check if it's a timeout
    if (error.message.includes("timeout")) {
      return {
        message: "Request to Peacock API timed out. Please try again.",
        endpoint,
        originalError: error,
      };
    }

    // Check for authentication errors
    if (
      error.message.includes("Login failed") ||
      error.message.includes("session cookie")
    ) {
      return {
        message: "Authentication failed. Unable to connect to Peacock API.",
        endpoint,
        originalError: error,
      };
    }

    // Extract status code if available
    const statusMatch = error.message.match(/(\d{3})/);
    const statusCode = statusMatch ? parseInt(statusMatch[1], 10) : undefined;

    return {
      message: error.message,
      endpoint,
      statusCode,
      originalError: error,
    };
  }

  return {
    message: "An unexpected error occurred while calling Peacock API.",
    endpoint,
    originalError: error,
  };
}

/**
 * Check if error is from Peacock API
 */
export function isPeacockApiError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes("peacock") ||
      message.includes("api request failed") ||
      message.includes("login failed") ||
      message.includes("session cookie") ||
      message.includes("authentication failed")
    );
  }
  return false;
}
