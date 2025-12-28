import { type Request, type Response, type NextFunction } from 'express'

export interface AppError extends Error {
    statusCode?: number
    isOperational?: boolean
}

export function errorHandler(
    err: AppError | Error,
    req: Request,
    res: Response,
    next: NextFunction
): void {
    const statusCode = (err as AppError).statusCode ?? 500
    const isOperational = (err as AppError).isOperational ?? false

    // Log error
    console.error('Error:', {
        message: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
        statusCode,
    })

    // Send error response
    res.status(statusCode).json({
        error: err.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && {
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

