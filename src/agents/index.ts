/**
 * Agents Module
 * Main entry point for agent functionality
 * 
 * This module provides:
 * - Main agent manager (ReactAgent) for general chat
 * - Finance memory agent (AgentExecutor) for finance queries with memory
 * - Tools, middleware, and prompts
 */

// Agent Manager (Main agent for chat)
export { default as agentManager } from './managers/agent-manager'

// Middleware
export { withGuardrail } from './middleware/guardrail'

// Memory Module (Finance agent with vector store)
export * from './memory'

// Backward compatibility
import agentManager from './managers/agent-manager'

export async function getAgent() {
  return agentManager.getAgent()
}
