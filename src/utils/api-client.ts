/**
 * API Client for Peacock App API
 * Handles HTTP requests to the Peacock API endpoints
 */

import { getCachedResponse, setCachedResponse } from "./api-cache";
import { type ApiErrorInfo, formatApiError } from "./api-error";
import { logger } from "./logger";

/**
 * Get API base URL from environment (lazy evaluation to ensure dotenv is loaded)
 */
function getApiBaseUrl(): string {
  return process.env.PEACOCK_API_URL || "http://localhost:3001";
}

// Admin credentials for agent access
const ADMIN_USERNAME = process.env.PEACOCK_ADMIN_USERNAME || "admin";
const ADMIN_PASSWORD = process.env.PEACOCK_ADMIN_PASSWORD || "peacock";

// Session cookie storage with expiration tracking
interface SessionCookie {
  cookie: string;
  createdAt: number;
  expiresAt: number; // 7 days from creation
  refreshAt: number; // 5 days from creation (refresh before expiration)
}

let sessionCookieData: SessionCookie | null = null;
let loginPromise: Promise<string> | null = null;

// Token expiration constants
const TOKEN_VALIDITY_DAYS = 7;
const TOKEN_REFRESH_DAYS = 5;
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

interface ApiClientOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
  cookies?: string;
}

/**
 * Check if current session cookie is still valid
 */
function isSessionValid(): boolean {
  if (!sessionCookieData) {
    return false;
  }

  const now = Date.now();

  // Check if token has expired (7 days)
  if (now >= sessionCookieData.expiresAt) {
    logger.debug("Session cookie expired");
    return false;
  }

  return true;
}

/**
 * Check if session cookie needs refresh (5 days old)
 */
function shouldRefreshSession(): boolean {
  if (!sessionCookieData) {
    return true;
  }

  const now = Date.now();

  // Refresh if token is older than 5 days (before 7-day expiration)
  return now >= sessionCookieData.refreshAt;
}

/**
 * Login and get session cookie
 * Only calls the API if token doesn't exist, is expired, or needs refresh
 */
async function login(): Promise<string> {
  // If login is already in progress, wait for it
  if (loginPromise) {
    return loginPromise;
  }

  // Check if we have a valid session cookie that doesn't need refresh
  if (sessionCookieData && isSessionValid() && !shouldRefreshSession()) {
    logger.debug("Using cached session cookie");
    return sessionCookieData.cookie;
  }

  // If token needs refresh but is still valid, log it
  if (sessionCookieData && isSessionValid() && shouldRefreshSession()) {
    logger.debug("Refreshing session cookie (5 days old, still valid)");
  }

  // Start login process
  loginPromise = (async () => {
    try {
      logger.debug("Logging in as admin...");
      const baseUrl = getApiBaseUrl();
      const url = `${baseUrl}/api/auth/login`;

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: ADMIN_USERNAME,
          password: ADMIN_PASSWORD,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Login failed: ${response.status} ${response.statusText} - ${errorText}`
        );
      }

      // Extract session cookie from Set-Cookie header
      // Note: The cookie name is 'pc_auth', not 'session'
      const setCookieHeader = response.headers.get("set-cookie");

      if (setCookieHeader) {
        // Extract the pc_auth cookie value
        const match = setCookieHeader.match(/pc_auth=([^;]+)/);

        if (match) {
          const now = Date.now();
          const cookie = `pc_auth=${match[1]}`;

          // Store cookie with expiration tracking
          sessionCookieData = {
            cookie,
            createdAt: now,
            expiresAt: now + TOKEN_VALIDITY_DAYS * MILLISECONDS_PER_DAY, // 7 days
            refreshAt: now + TOKEN_REFRESH_DAYS * MILLISECONDS_PER_DAY, // 5 days
          };

          logger.info(
            `Successfully logged in as admin. Token expires in ${TOKEN_VALIDITY_DAYS} days, will refresh in ${TOKEN_REFRESH_DAYS} days`
          );
          return cookie;
        }
      }

      throw new Error("No session cookie received from login");
    } catch (error) {
      loginPromise = null;
      const errorInfo = formatApiError(error, "/api/auth/login");
      logger.error("Login error:", errorInfo.message);
      const apiError = new Error(errorInfo.message);
      (apiError as Error & { apiErrorInfo: ApiErrorInfo }).apiErrorInfo =
        errorInfo;
      throw apiError;
    } finally {
      loginPromise = null;
    }
  })();

  return loginPromise;
}

/**
 * Get authenticated session cookie (login if needed)
 * Only calls login API if token doesn't exist, is expired, or needs refresh (5+ days old)
 */
async function getSessionCookie(): Promise<string> {
  // Check if we have a valid session that doesn't need refresh
  if (sessionCookieData && isSessionValid() && !shouldRefreshSession()) {
    return sessionCookieData.cookie;
  }

  // Token expired or needs refresh - get new one
  return await login();
}

/**
 * Clear session token (for cache clearing)
 */
export function clearSessionToken(): void {
  sessionCookieData = null;
  loginPromise = null;
  logger.debug("Session token cleared");
}

/**
 * Make a request to the Peacock API
 * Checks cache first, only makes API call if cache miss
 */
export async function apiRequest<T>(
  endpoint: string,
  options: ApiClientOptions = {}
): Promise<T> {
  const { method = "GET", body, headers = {} } = options;

  // Check cache first (skip cache for login and health endpoints)
  const shouldCache =
    !endpoint.includes("/health") && !endpoint.includes("/auth/login");
  if (shouldCache) {
    const cached = getCachedResponse<T>(endpoint, { method, body });
    if (cached !== null) {
      logger.debug(`Cache hit for ${endpoint}`);
      return cached;
    }
    logger.debug(`Cache miss for ${endpoint}`);
  }

  // If no cookies provided and endpoint requires auth, use admin session
  const requiresAuth =
    !endpoint.includes("/health") && !endpoint.includes("/auth/login");
  const sessionCookies = requiresAuth ? await getSessionCookie() : undefined;

  const url = endpoint.startsWith("http")
    ? endpoint
    : `${getApiBaseUrl()}${endpoint}`;

  const requestHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...headers,
  };

  if (sessionCookies) {
    requestHeaders["Cookie"] = sessionCookies;
  }

  try {
    const response = await fetch(url, {
      method,
      headers: requestHeaders,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `API request failed: ${response.status} ${response.statusText}`;

      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error || errorJson.message || errorMessage;
      } catch {
        // If not JSON, use the text as error message
        if (errorText) {
          errorMessage = errorText;
        }
      }

      throw new Error(errorMessage);
    }

    const contentType = response.headers.get("content-type");
    let result: T;

    if (contentType?.includes("application/json")) {
      result = (await response.json()) as T;
    } else {
      result = (await response.text()) as T;
    }

    // Cache successful responses
    if (shouldCache) {
      setCachedResponse(endpoint, result, { method, body });
    }

    return result;
  } catch (error) {
    const errorInfo = formatApiError(error, endpoint);
    logger.error(`API request error for ${endpoint}:`, errorInfo.message);

    // Create a more informative error with context
    const apiError = new Error(errorInfo.message);
    (apiError as Error & { apiErrorInfo: ApiErrorInfo }).apiErrorInfo =
      errorInfo;
    throw apiError;
  }
}

/**
 * Get member details by username
 */
export async function getMemberDetails(username: string) {
  try {
    return await apiRequest(
      `/api/account/member/${encodeURIComponent(username)}`,
      {
        method: "POST",
      }
    );
  } catch (error) {
    const errorInfo = formatApiError(error, `/api/account/member/${username}`);
    logger.error("Error getting member details:", errorInfo.message);
    throw error;
  }
}

/**
 * Get loan accounts
 */
export async function getLoanAccounts() {
  try {
    return await apiRequest("/api/account/loan", {
      method: "POST",
    });
  } catch (error) {
    const errorInfo = formatApiError(error, "/api/account/loan");
    logger.error("Error getting loan accounts:", errorInfo.message);
    throw error;
  }
}

/**
 * Get transactions with optional filters
 */
export async function getTransactions(
  filters: {
    page?: number;
    limit?: number;
    accountId?: string;
    transactionType?: string;
    startDate?: string;
    endDate?: string;
    sortField?: string;
    sortOrder?: "asc" | "desc";
  } = {}
) {
  const queryParams = new URLSearchParams();

  if (filters.page) queryParams.append("page", String(filters.page));
  if (filters.limit) queryParams.append("limit", String(filters.limit));
  if (filters.accountId) queryParams.append("accountId", filters.accountId);
  if (filters.transactionType)
    queryParams.append("transactionType", filters.transactionType);
  if (filters.startDate) queryParams.append("startDate", filters.startDate);
  if (filters.endDate) queryParams.append("endDate", filters.endDate);
  if (filters.sortField) queryParams.append("sortField", filters.sortField);
  if (filters.sortOrder) queryParams.append("sortOrder", filters.sortOrder);

  const queryString = queryParams.toString();
  const endpoint = `/api/transaction${queryString ? `?${queryString}` : ""}`;

  try {
    return await apiRequest(endpoint, {
      method: "POST",
    });
  } catch (error) {
    const errorInfo = formatApiError(error, endpoint);
    logger.error("Error getting transactions:", errorInfo.message);
    throw error;
  }
}

/**
 * Search across members, vendors, loans, and transactions
 */
export async function search(query: string) {
  try {
    return await apiRequest("/api/search", {
      method: "POST",
      body: { searchQuery: query },
    });
  } catch (error) {
    const errorInfo = formatApiError(error, "/api/search");
    logger.error("Error searching:", errorInfo.message);
    throw error;
  }
}

/**
 * Create a new transaction
 */
export async function createTransaction(data: {
  fromId: string
  toId: string
  amount: number
  transactionType: string
  occurredAt?: string
  description?: string
}) {
  try {
    return await apiRequest("/api/transaction/create", {
      method: "POST",
      body: data,
    });
  } catch (error) {
    const errorInfo = formatApiError(error, "/api/transaction/create");
    logger.error("Error creating transaction:", errorInfo.message);
    throw error;
  }
}

/**
 * Delete a transaction by ID
 */
export async function deleteTransaction(transactionId: string) {
  try {
    return await apiRequest(`/api/transaction/${transactionId}`, {
      method: "DELETE",
    });
  } catch (error) {
    const errorInfo = formatApiError(error, `/api/transaction/${transactionId}`);
    logger.error("Error deleting transaction:", errorInfo.message);
    throw error;
  }
}
