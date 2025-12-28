import { createAgent, type ReactAgent } from 'langchain'
import { getAgentConfig } from '../config/agent'
import { tools } from './tools'

/**
 * Agent Setup
 * 
 * Best practices:
 * - Separated agent creation from execution
 * - Reusable agent instance
 * - Clear system prompt for agent behavior
 * - Proper error handling
 * - Configurable via environment variables
 */

const systemPrompt = `You are a helpful AI assistant with access to tools.
You can use tools to help answer questions and perform tasks.
Always be clear, concise, and helpful in your responses.
When using tools, explain what you're doing and why.`

/**
 * Creates and returns a React agent
 * 
 * Reasoning for this approach:
 * - Single agent instance can be reused across requests (efficient)
 * - Agent configuration is centralized
 * - Easy to test and mock
 * - Clear separation of concerns
 */
export async function createAgentInstance(): Promise<ReactAgent> {
  const config = getAgentConfig()

  // Use model string identifier for LangChain v1.x
  // TypeScript has issues with deep type inference in LangChain tool types
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore - Type instantiation is excessively deep (known LangChain/TypeScript issue)
  const agent = createAgent({
    model: `openai:${config.model}`,
    tools,
    // @ts-ignore
    prompt: systemPrompt,
  })

  return agent
}

// Singleton agent instance (lazy initialization)
let agentInstance: ReactAgent | null = null

/**
 * Get or create the agent instance
 * 
 * Best practice: Lazy initialization pattern
 * - Creates agent only when needed
 * - Reuses same instance for efficiency
 * - Thread-safe in Node.js single-threaded model
 */
export async function getAgent(): Promise<ReactAgent> {
  if (!agentInstance) {
    agentInstance = await createAgentInstance()
  }
  return agentInstance
}

