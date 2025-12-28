import express, { type Express, type Request, type Response, type NextFunction } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { healthRouter } from './routes/health'
import { apiRouter } from './routes/api'
import { agentRouter } from './routes/agent'
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
    app.use('/api/agent', agentRouter)

    // Error handling (must be last)
    app.use(notFoundHandler)
    app.use(errorHandler)

    return app
}
