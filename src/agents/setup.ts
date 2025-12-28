/**
 * Agent Setup (Legacy)
 * @deprecated Use agentManager from './index' instead
 * This file is kept for backward compatibility
 */

import agentManager from './managers/agent-manager'

/**
 * @deprecated Use agentManager.getAgent() instead
 */
export async function createAgentInstance() {
  return agentManager.getAgent()
}

/**
 * @deprecated Use agentManager.getAgent() instead
 */
export async function getAgent() {
  return agentManager.getAgent()
}
