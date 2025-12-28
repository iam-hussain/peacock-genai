/**
 * Agent Manager
 * Simple singleton manager that creates and caches the agent once
 */

import { type ReactAgent } from 'langchain'
import { createAgentInstance } from '../factory/agent-factory'

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
      console.log('♻️  Using cached agent (no creation needed)')
      return this.agent
    }

    // If initialization is in progress, wait for it
    if (this.initPromise) {
      return this.initPromise
    }

    // Create agent (only once)
    if (!this.isInitialized) {
      console.log('🔄 First call: Creating agent instance (this happens only once)')
      this.isInitialized = true
    }

    this.initPromise = createAgentInstance()

    try {
      this.agent = await this.initPromise
      console.log('✅ Agent created and cached - will be reused for all future requests')
      return this.agent
    } finally {
      this.initPromise = null
    }
  }

  /**
   * Initialize agent at startup
   */
  async initialize(): Promise<void> {
    await this.getAgent()
    console.log('Agent initialized')
  }
}

// Singleton instance
const agentManager = new AgentManager()

export default agentManager

