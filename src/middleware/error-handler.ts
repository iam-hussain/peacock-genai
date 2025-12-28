import { type Request, type Response, type NextFunction } from 'express'
import { logger } from '../utils/logger'

export interface AppError extends Error {
    statusCode?: number
    isOperational?: boolean
}

/**
 * Sanitizes error messages to remove sensitive information and provide user-friendly messages
 */
function sanitizeErrorMessage(error: Error | AppError): string {
    const message = error.message || 'An unexpected error occurred'

    // Handle API key errors
    if (message.includes('API key') || message.includes('401') || message.includes('Incorrect API key')) {
        return 'Invalid API key. Please check your OpenAI API key configuration in the .env file. You can find your API key at https://platform.openai.com/account/api-keys'
    }

    // Handle authentication errors
    if (message.includes('401') || message.includes('Unauthorized')) {
        return 'Authentication failed. Please check your API credentials.'
    }

    // Handle rate limit errors
    if (message.includes('429') || message.includes('rate limit')) {
        return 'Rate limit exceeded. Please try again in a few moments.'
    }

    // Handle network/connection errors
    if (message.includes('ECONNREFUSED') || message.includes('network') || message.includes('fetch')) {
        return 'Unable to connect to the service. Please check your internet connection and try again.'
    }

    // Handle timeout errors
    if (message.includes('timeout') || message.includes('ETIMEDOUT')) {
        return 'Request timed out. Please try again.'
    }

    // Remove sensitive information (API keys, tokens, etc.)
    let sanitized = message
        .replace(/sk-[a-zA-Z0-9]{20,}/g, '[API_KEY_REDACTED]')
        .replace(/your_act[a-zA-Z0-9_*]+/gi, '[API_KEY_REDACTED]')
        .replace(/api[_-]?key['":\s]*[=:]\s*[a-zA-Z0-9_-]+/gi, 'api_key=[REDACTED]')

    // For production, don't expose internal error details
    if (process.env.NODE_ENV === 'production' && !(error as AppError).isOperational) {
        return 'An error occurred while processing your request. Please try again later.'
    }

    return sanitized
}

export function errorHandler(
    err: AppError | Error,
    req: Request,
    res: Response,
    next: NextFunction
): void {
    const statusCode = (err as AppError).statusCode ?? 500
    const isOperational = (err as AppError).isOperational ?? false
    const sanitizedMessage = sanitizeErrorMessage(err)

    // Log full error details (server-side only)
    // Only log original message if it's different from sanitized (to avoid duplicate logs)
    const logData: any = {
        sanitizedMessage,
        path: req.path,
        method: req.method,
        statusCode,
    }

    // Include original error details in development or if message was sanitized
    if (process.env.NODE_ENV === 'development' || err.message !== sanitizedMessage) {
        logData.originalMessage = err.message
        if (err.stack) {
            logData.stack = err.stack
        }
    }

    logger.error('Request error', logData)

    // Send sanitized error response
    res.status(statusCode).json({
        error: sanitizedMessage,
        ...(process.env.NODE_ENV === 'development' && {
            originalError: err.message,
            stack: err.stack,
            path: req.path,
        }),
    })
}

export function notFoundHandler(req: Request, res: Response): void {
    res.status(404).json({
        error: 'Not found',
        path: req.path,
    })
}

// Helper function to create operational errors
export function createError(message: string, statusCode: number = 500): AppError {
    const error = new Error(message) as AppError
    error.statusCode = statusCode
    error.isOperational = true
    return error
}

