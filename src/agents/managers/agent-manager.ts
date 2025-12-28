/**
 * Agent Manager
 * Simple singleton manager that creates and caches the agent once
 */

import { type ReactAgent } from 'langchain'
import { createAgentInstance } from '../factory/agent-factory'
import { logger } from '../../utils/logger'

class AgentManager {
  private agent: ReactAgent | null = null
  private initPromise: Promise<ReactAgent> | null = null
  private isInitialized = false

  /**
   * Get the agent instance (creates once, then reuses)
   */
  async getAgent(): Promise<ReactAgent> {
    // Return cached agent if it exists
    if (this.agent) {
      logger.debug('Using cached agent (no creation needed)')
      return this.agent
    }

    // If initialization is in progress, wait for it
    if (this.initPromise) {
      logger.debug('Agent initialization in progress, waiting...')
      return this.initPromise
    }

    // Create agent (only once)
    if (!this.isInitialized) {
      logger.info('First call: Creating agent instance (this happens only once)')
      this.isInitialized = true
    }

    this.initPromise = createAgentInstance()

    try {
      this.agent = await this.initPromise
      logger.info('Agent created and cached - will be reused for all future requests')
      return this.agent
    } catch (error) {
      logger.error('Failed to create agent:', error)
      this.isInitialized = false // Allow retry
      throw error
    } finally {
      this.initPromise = null
    }
  }

  /**
   * Initialize agent at startup
   */
  async initialize(): Promise<void> {
    try {
      await this.getAgent()
      logger.info('Agent initialized successfully')
    } catch (error) {
      logger.error('Failed to initialize agent:', error)
      throw error
    }
  }
}

// Singleton instance
const agentManager = new AgentManager()

export default agentManager

