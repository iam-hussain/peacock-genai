import express, { type Express, type Request, type Response, type NextFunction } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { healthRouter } from './routes/health'
import { apiRouter } from './routes/api'
import { errorHandler, notFoundHandler } from './middleware/error-handler'

export function createApp(): Express {
    const app = express()

    // Middleware
    app.use(helmet())
    app.use(cors())
    app.use(express.json())
    app.use(express.urlencoded({ extended: true }))

    // Request logging
    app.use((req: Request, res: Response, next: NextFunction) => {
        console.log(`${req.method} ${req.path}`)
        next()
    })

    // Routes
    app.use('/health', healthRouter)
    app.use('/api', apiRouter)

    // Error handling (must be last)
    app.use(notFoundHandler)
    app.use(errorHandler)

    return app
}
