import express, { type Express, type Request, type Response, type NextFunction } from 'express'
import path from 'path'
import cors from 'cors'
import helmet from 'helmet'
import { healthRouter } from './routes/health'
import { apiRouter } from './routes/api'
import { agentRouter } from './routes/agent'
import { errorHandler, notFoundHandler } from './middleware/error-handler'

export function createApp(): Express {
    const app = express()

    // Middleware
    app.use(helmet({
        contentSecurityPolicy: false, // Allow inline styles for the chat page
    }))
    app.use(cors())
    app.use(express.json())
    app.use(express.urlencoded({ extended: true }))

    // Serve static files from public directory
    // Handle both development and production paths
    const publicPath = path.join(__dirname, '../public')
    app.use(express.static(publicPath))

    // Request logging
    app.use((req: Request, res: Response, next: NextFunction) => {
        console.log(`${req.method} ${req.path}`)
        next()
    })

    // Routes
    app.use('/health', healthRouter)
    app.use('/api', apiRouter)
    app.use('/api/agent', agentRouter)

    // Serve chat page at root
    app.get('/', (req: Request, res: Response) => {
        const indexPath = path.join(publicPath, 'index.html')
        res.sendFile(indexPath)
    })

    // Error handling (must be last)
    app.use(notFoundHandler)
    app.use(errorHandler)

    return app
}
