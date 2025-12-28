/**
 * API Client for Peacock App API
 * Handles HTTP requests to the Peacock API endpoints
 */

import { logger } from './logger'

/**
 * Get API base URL from environment (lazy evaluation to ensure dotenv is loaded)
 */
function getApiBaseUrl(): string {
    return process.env.PEACOCK_API_URL || 'http://localhost:3001'
}

// Admin credentials for agent access
const ADMIN_USERNAME = process.env.PEACOCK_ADMIN_USERNAME || 'admin'
const ADMIN_PASSWORD = process.env.PEACOCK_ADMIN_PASSWORD || 'peacock'

// Session cookie storage
let sessionCookie: string | null = null
let loginPromise: Promise<string> | null = null

interface ApiClientOptions {
    method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
    body?: unknown
    headers?: Record<string, string>
    cookies?: string
}

/**
 * Login and get session cookie
 */
async function login(): Promise<string> {
    // If login is already in progress, wait for it
    if (loginPromise) {
        return loginPromise
    }

    // If we already have a session cookie, return it
    if (sessionCookie) {
        return sessionCookie
    }

    // Start login process
    loginPromise = (async () => {
        try {
            logger.debug('Logging in as admin...')
            const baseUrl = getApiBaseUrl()
            const url = `${baseUrl}/api/auth/login`

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: ADMIN_USERNAME,
                    password: ADMIN_PASSWORD,
                }),
            })

            if (!response.ok) {
                const errorText = await response.text()
                throw new Error(`Login failed: ${response.status} ${response.statusText} - ${errorText}`)
            }

            // Extract session cookie from Set-Cookie header
            // Note: The cookie name is 'pc_auth', not 'session'
            const setCookieHeader = response.headers.get('set-cookie')

            if (setCookieHeader) {
                // Extract the pc_auth cookie value
                const match = setCookieHeader.match(/pc_auth=([^;]+)/)

                if (match) {
                    sessionCookie = `pc_auth=${match[1]}`
                    logger.info('Successfully logged in as admin')
                    return sessionCookie
                }
            }

            throw new Error('No session cookie received from login')
        } catch (error) {
            loginPromise = null
            throw error
        } finally {
            loginPromise = null
        }
    })()

    return loginPromise
}

/**
 * Get authenticated session cookie (login if needed)
 */
async function getSessionCookie(): Promise<string> {
    if (sessionCookie) {
        return sessionCookie
    }
    return await login()
}

/**
 * Make a request to the Peacock API
 */
export async function apiRequest<T>(
    endpoint: string,
    options: ApiClientOptions = {}
): Promise<T> {
    const { method = 'GET', body, headers = {}, cookies } = options

    // If no cookies provided and endpoint requires auth, use admin session
    const requiresAuth = !endpoint.includes('/health') && !endpoint.includes('/auth/login')
    const sessionCookies = cookies || (requiresAuth ? await getSessionCookie() : undefined)

    const url = endpoint.startsWith('http') ? endpoint : `${getApiBaseUrl()}${endpoint}`

    const requestHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        ...headers,
    }

    if (sessionCookies) {
        requestHeaders['Cookie'] = sessionCookies
    }

    try {
        const response = await fetch(url, {
            method,
            headers: requestHeaders,
            body: body ? JSON.stringify(body) : undefined,
        })

        if (!response.ok) {
            const errorText = await response.text()
            let errorMessage = `API request failed: ${response.status} ${response.statusText}`

            try {
                const errorJson = JSON.parse(errorText)
                errorMessage = errorJson.error || errorJson.message || errorMessage
            } catch {
                // If not JSON, use the text as error message
                if (errorText) {
                    errorMessage = errorText
                }
            }

            throw new Error(errorMessage)
        }

        const contentType = response.headers.get('content-type')
        if (contentType?.includes('application/json')) {
            return (await response.json()) as T
        }

        return (await response.text()) as T
    } catch (error) {
        if (error instanceof Error) {
            logger.error(`API request error for ${endpoint}:`, error.message)
            throw error
        }
        throw new Error(`Unknown error occurred: ${String(error)}`)
    }
}

/**
 * Get member details by username
 */
export async function getMemberDetails(username: string) {
    return apiRequest(`/api/account/member/${encodeURIComponent(username)}`, {
        method: 'POST',
    })
}

/**
 * Get loan accounts
 */
export async function getLoanAccounts() {
    return apiRequest('/api/account/loan', {
        method: 'POST',
    })
}

/**
 * Get transactions with optional filters
 */
export async function getTransactions(
    filters: {
        page?: number
        limit?: number
        accountId?: string
        transactionType?: string
        startDate?: string
        endDate?: string
        sortField?: string
        sortOrder?: 'asc' | 'desc'
    } = {}
) {
    const queryParams = new URLSearchParams()

    if (filters.page) queryParams.append('page', String(filters.page))
    if (filters.limit) queryParams.append('limit', String(filters.limit))
    if (filters.accountId) queryParams.append('accountId', filters.accountId)
    if (filters.transactionType) queryParams.append('transactionType', filters.transactionType)
    if (filters.startDate) queryParams.append('startDate', filters.startDate)
    if (filters.endDate) queryParams.append('endDate', filters.endDate)
    if (filters.sortField) queryParams.append('sortField', filters.sortField)
    if (filters.sortOrder) queryParams.append('sortOrder', filters.sortOrder)

    const queryString = queryParams.toString()
    const endpoint = `/api/transaction${queryString ? `?${queryString}` : ''}`

    return apiRequest(endpoint, {
        method: 'POST',
    })
}

/**
 * Search across members, vendors, loans, and transactions
 */
export async function search(query: string) {
    return apiRequest('/api/search', {
        method: 'POST',
        body: { searchQuery: query },
    })
}

