/**
 * Agents Module
 * Main entry point for agent functionality
 */

// Agent Manager
export { default as agentManager } from './managers/agent-manager'

// Agent Factory
export { createAgentInstance } from './factory/agent-factory'

// Types
export type {
  AgentConfig,
  AgentInstance,
  AgentType,
  AgentFactoryOptions,
} from './types'

// Middleware
export { withGuardrail } from './middleware/guardrail'

// Prompts
export { getSystemPrompt, CLUB_AGENT_PROMPT } from './prompts/club-agent.prompt'

// Backward compatibility
import agentManager from './managers/agent-manager'

export async function getAgent() {
  return agentManager.getAgent()
}

