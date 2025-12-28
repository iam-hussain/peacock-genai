import { type Request, type Response, type NextFunction } from 'express'
import { type ZodSchema } from 'zod'
import { createError } from './error-handler'

/**
 * Validation schemas for request validation
 */
export interface ValidationSchemas {
    body?: ZodSchema<any>
    headers?: ZodSchema<any>
    params?: ZodSchema<any>
    query?: ZodSchema<any>
}

/**
 * Extended Request type with validated data
 */
export interface ValidatedRequest<TBody = any, THeaders = any, TParams = any, TQuery = any> extends Request {
    validatedBody?: TBody
    validatedHeaders?: THeaders
    validatedParams?: TParams
    validatedQuery?: TQuery
}

/**
 * Creates a validation middleware function
 * 
 * Similar to express-validator, but using Zod schemas.
 * Validates body, headers, params, and query based on provided schemas.
 * 
 * @param schemas - Object containing Zod schemas for body, headers, params, and query
 * @returns Express middleware function
 * 
 * @example
 * ```ts
 * const validateMessage = validate({
 *   body: messageSchema,
 *   headers: authHeaderSchema,
 * })
 * 
 * router.post('/', validateMessage, handler)
 * ```
 */
export function validate(schemas: ValidationSchemas) {
    return (req: Request, res: Response, next: NextFunction): void => {
        try {
            const errors: string[] = []

            // Validate body
            if (schemas.body) {
                const bodyResult = schemas.body.safeParse(req.body)
                if (!bodyResult.success) {
                    const fieldErrors = bodyResult.error.flatten().fieldErrors
                    const errorMessages = Object.entries(fieldErrors)
                        .map(([field, messages]) => `body.${field}: ${messages?.join(', ')}`)
                        .join('; ')
                    errors.push(errorMessages)
                } else {
                    // Attach validated body to request
                    ;(req as ValidatedRequest).validatedBody = bodyResult.data
                }
            }

            // Validate headers
            if (schemas.headers) {
                const headersResult = schemas.headers.safeParse(req.headers)
                if (!headersResult.success) {
                    const fieldErrors = headersResult.error.flatten().fieldErrors
                    const errorMessages = Object.entries(fieldErrors)
                        .map(([field, messages]) => `headers.${field}: ${messages?.join(', ')}`)
                        .join('; ')
                    errors.push(errorMessages)
                } else {
                    // Attach validated headers to request
                    ;(req as ValidatedRequest).validatedHeaders = headersResult.data
                }
            }

            // Validate params
            if (schemas.params) {
                const paramsResult = schemas.params.safeParse(req.params)
                if (!paramsResult.success) {
                    const fieldErrors = paramsResult.error.flatten().fieldErrors
                    const errorMessages = Object.entries(fieldErrors)
                        .map(([field, messages]) => `params.${field}: ${messages?.join(', ')}`)
                        .join('; ')
                    errors.push(errorMessages)
                } else {
                    // Attach validated params to request
                    ;(req as ValidatedRequest).validatedParams = paramsResult.data
                }
            }

            // Validate query
            if (schemas.query) {
                const queryResult = schemas.query.safeParse(req.query)
                if (!queryResult.success) {
                    const fieldErrors = queryResult.error.flatten().fieldErrors
                    const errorMessages = Object.entries(fieldErrors)
                        .map(([field, messages]) => `query.${field}: ${messages?.join(', ')}`)
                        .join('; ')
                    errors.push(errorMessages)
                } else {
                    // Attach validated query to request
                    ;(req as ValidatedRequest).validatedQuery = queryResult.data
                }
            }

            // If there are validation errors, throw an error
            if (errors.length > 0) {
                throw createError(`Validation failed: ${errors.join('; ')}`, 400)
            }

            next()
        } catch (error) {
            next(error)
        }
    }
}

