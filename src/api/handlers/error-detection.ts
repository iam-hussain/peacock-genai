/**
 * Error Detection Utilities
 * Centralized error detection logic for better maintainability
 */

export interface ErrorInfo {
  isApiKeyError: boolean
  isRateLimitError: boolean
  isQuotaError: boolean
  statusCode?: number
  message: string
}

/**
 * Detect error type from error object
 */
export function detectErrorType(error: any): ErrorInfo {
  const errorMessage = error?.message || String(error) || 'Unknown error'
  const errorStatus = error?.status || error?.statusCode || error?.response?.status
  const normalizedMessage = errorMessage.toLowerCase()

  return {
    isApiKeyError:
      errorStatus === 401 ||
      normalizedMessage.includes('incorrect api key') ||
      normalizedMessage.includes('invalid api key') ||
      normalizedMessage.includes('authentication failed'),
    isRateLimitError:
      errorStatus === 429 ||
      normalizedMessage.includes('rate limit exceeded') ||
      normalizedMessage.includes('too many requests'),
    isQuotaError:
      errorStatus === 402 ||
      normalizedMessage.includes('insufficient quota') ||
      normalizedMessage.includes('billing'),
    statusCode: errorStatus,
    message: errorMessage,
  }
}

