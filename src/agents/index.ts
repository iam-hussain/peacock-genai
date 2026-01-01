/**
 * Agents Module
 * Main entry point for agent functionality
 */

// Agent Manager
export { default as agentManager } from './managers/agent-manager'

// Middleware
export { withGuardrail } from './middleware/guardrail'

// Backward compatibility
import agentManager from './managers/agent-manager'

export async function getAgent() {
  return agentManager.getAgent()
}
