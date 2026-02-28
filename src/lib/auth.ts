/**
 * Shared Peacock API authentication
 * Centralizes session cookie management for server-side API access
 *
 * Token generation: POST /api/auth/login (see swagger)
 * - Body: { username, password }
 * - Response: Set-Cookie header with session token
 */

import { type ApiErrorInfo, formatApiError } from "@/utils/api-error";
import { logger } from "@/utils/logger";

const ADMIN_USERNAME = process.env.PEACOCK_ADMIN_USERNAME || "admin";
const ADMIN_PASSWORD = process.env.PEACOCK_ADMIN_PASSWORD || "peacock";

/** Cookie names used by Peacock API (swagger: "session", some deployments: "pc_auth") */
const COOKIE_NAMES = ["session", "pc_auth"];

const TOKEN_VALIDITY_DAYS = 7;
const TOKEN_REFRESH_DAYS = 5;
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

interface SessionCookie {
  cookie: string;
  createdAt: number;
  expiresAt: number;
  refreshAt: number;
}

let sessionCookieData: SessionCookie | null = null;
let loginPromise: Promise<string> | null = null;

export function getPeacockApiUrl(): string {
  return process.env.PEACOCK_API_URL || "http://localhost:3001";
}

function isSessionValid(): boolean {
  if (!sessionCookieData) return false;
  const now = Date.now();
  if (now >= sessionCookieData.expiresAt) {
    logger.debug("Session cookie expired");
    return false;
  }
  return true;
}

function shouldRefreshSession(): boolean {
  if (!sessionCookieData) return true;
  const now = Date.now();
  return now >= sessionCookieData.refreshAt;
}

async function login(): Promise<string> {
  if (loginPromise) return loginPromise;

  if (sessionCookieData && isSessionValid() && !shouldRefreshSession()) {
    logger.debug("Using cached session cookie");
    return sessionCookieData.cookie;
  }

  if (sessionCookieData && isSessionValid() && shouldRefreshSession()) {
    logger.debug("Refreshing session cookie (5 days old, still valid)");
  }

  loginPromise = (async () => {
    try {
      logger.debug("Logging in as admin...");
      const baseUrl = getPeacockApiUrl();
      const url = `${baseUrl}/api/auth/login`;

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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

      const setCookieHeader = response.headers.get("set-cookie");
      if (setCookieHeader) {
        let cookie: string | null = null;
        for (const name of COOKIE_NAMES) {
          const match = setCookieHeader.match(
            new RegExp(`${name}=([^;]+)`, "i")
          );
          if (match) {
            cookie = `${name}=${match[1]}`;
            break;
          }
        }
        if (cookie) {
          const now = Date.now();
          sessionCookieData = {
            cookie,
            createdAt: now,
            expiresAt: now + TOKEN_VALIDITY_DAYS * MILLISECONDS_PER_DAY,
            refreshAt: now + TOKEN_REFRESH_DAYS * MILLISECONDS_PER_DAY,
          };
          logger.info(
            `Successfully logged in via /api/auth/login. Token expires in ${TOKEN_VALIDITY_DAYS} days, will refresh in ${TOKEN_REFRESH_DAYS} days`
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
 */
export async function getSessionCookie(): Promise<string> {
  if (sessionCookieData && isSessionValid() && !shouldRefreshSession()) {
    return sessionCookieData.cookie;
  }
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
 * Authenticated fetch to Peacock API.
 * Automatically includes the session cookie (login token) in all requests.
 * Use this for all tool API calls.
 */
export async function peacockFetch(
  path: string,
  init: RequestInit = {}
): Promise<Response> {
  const cookie = await getSessionCookie();
  const baseUrl = getPeacockApiUrl();
  const url = path.startsWith("http") ? path : `${baseUrl}${path}`;

  const headers = new Headers(init.headers);
  headers.set("Cookie", cookie);
  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }

  return fetch(url, {
    ...init,
    headers,
  });
}
