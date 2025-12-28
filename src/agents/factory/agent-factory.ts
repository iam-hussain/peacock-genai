/**
 * Agent Factory
 * Creates LangChain agents with configuration
 */

import { createAgent, type ReactAgent } from 'langchain'
import { ChatOpenAI } from '@langchain/openai'
import { getSystemPrompt } from '../prompts/club-agent.prompt'
import { withGuardrail } from '../middleware/guardrail'
import { getAgentConfig } from '../../config/agent'
import { logger } from '../../utils/logger'
import { agentTools } from '../tools'

/**
 * Create a React agent instance
 */
export async function createAgentInstance(): Promise<ReactAgent> {
  const config = getAgentConfig()

  // Validate required config
  if (!config.model || !config.apiKey) {
    throw new Error('Model and API key are required')
  }

  // Create chat model
  const chatModel = new ChatOpenAI({
    modelName: config.model,
    temperature: config.temperature,
    maxTokens: config.maxTokens,
    timeout: config.timeout * 1000,
    openAIApiKey: config.apiKey,
  })

  // Get system prompt
  const systemPrompt = getSystemPrompt('club')

  logger.info('Factory: Creating new agent instance', {
    model: config.model,
    temperature: config.temperature,
    maxTokens: config.maxTokens,
    toolsCount: agentTools.length,
  })

  // Create agent with tools
  // @ts-ignore - Type instantiation is excessively deep
  let agent = createAgent({
    model: chatModel,
    // @ts-ignore
    prompt: systemPrompt,
    // @ts-ignore
    tools: agentTools,
  })

  // Apply guardrail middleware
  // agent = withGuardrail(agent)

  return agent
}

