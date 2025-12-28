import dotenv from 'dotenv'
import { createApp } from './app'
import { agentManager } from '../agents'
import { getAgentConfig } from '../config/agent'
import { logger } from '../utils/logger'

dotenv.config()

// Validate environment variables at startup
try {
  getAgentConfig()
  logger.info('Environment variables validated successfully')
} catch (error) {
  logger.error('Invalid environment variables:', error)
  process.exit(1)
}

const PORT = process.env.PORT ?? 3000
const app = createApp()

// Initialize agent at startup (non-blocking)
agentManager.initialize().catch((error) => {
  logger.warn('Agent will be initialized on first request:', error)
})

app.listen(PORT, () => {
    logger.info(`Server is running on http://localhost:${PORT}`)
})

