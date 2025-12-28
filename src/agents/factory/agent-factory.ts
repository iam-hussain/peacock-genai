/**
 * Agent Factory
 * Creates LangChain agents with configuration
 */

import { createAgent, type ReactAgent } from 'langchain'
import { ChatOpenAI } from '@langchain/openai'
import { getSystemPrompt } from '../prompts/club-agent.prompt'
import { withGuardrail } from '../middleware/guardrail'
import { getAgentConfig } from '../../config/agent'

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

  console.log('🔧 Factory: Creating new agent instance', {
    model: config.model,
    temperature: config.temperature,
    maxTokens: config.maxTokens,
  })

  // Create agent
  // @ts-ignore - Type instantiation is excessively deep
  let agent = createAgent({
    model: chatModel,
    // @ts-ignore
    prompt: systemPrompt,
  })

  // Apply guardrail middleware
  agent = withGuardrail(agent)

  return agent
}

