import dotenv from 'dotenv'
import { createApp } from './app'
import { agentManager } from '../agents'

dotenv.config()

const PORT = process.env.PORT ?? 3000
const app = createApp()

// Initialize agent at startup (non-blocking)
agentManager.initialize().catch((error) => {
  console.warn('Agent will be initialized on first request:', error)
})

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`)
})

