import { MessagesPlaceholder } from '@langchain/core/prompts'
import { ChatPromptTemplate } from '@langchain/core/prompts'
import { ChatOpenAI } from '@langchain/openai'
import { createAgent, type ReactAgent } from 'langchain'

import { getAgentConfig } from '../../config/agent'
import { logger } from '../../utils/logger'
import { withGuardrail } from '../middleware/guardrail'
import { agentTools } from '../tools'

class AgentManager {
  private agent: ReactAgent | null = null
  private initPromise: Promise<ReactAgent> | null = null

  async getAgent(): Promise<ReactAgent> {
    if (this.agent) return this.agent
    if (this.initPromise) return this.initPromise

    this.initPromise = (async () => {
      const config = getAgentConfig()
      if (!config.model || !config.apiKey) {
        throw new Error('Model and API key are required')
      }

      const chatModel = new ChatOpenAI({
        modelName: config.model,
        temperature: config.temperature,
        maxTokens: config.maxTokens,
        timeout: config.timeout * 1000,
        openAIApiKey: config.apiKey,
      })

      const prompt = ChatPromptTemplate.fromMessages([
        ['system', 'You are a helpful AI assistant for Peacock Club, a financial club management system.'],
        ['human', '{input}'],
        new MessagesPlaceholder('agent_scratchpad'),
      ])

      // LangChain's createAgent types don't include prompt parameter
      const agent = createAgent({
        model: chatModel,
        prompt,
        tools: agentTools,
      } as any) as ReactAgent

      return withGuardrail(agent)
    })()

    try {
      this.agent = await this.initPromise
      logger.info('Agent created and cached')
      return this.agent
    } catch (error) {
      logger.error('Failed to create agent:', error)
      this.initPromise = null
      throw error
    } finally {
      this.initPromise = null
    }
  }

  async initialize(): Promise<void> {
    await this.getAgent()
    logger.info('Agent initialized')
  }
}

export default new AgentManager()
