/**
 * Agent Tools
 * Exports all tools available to the agent
 */

import { getMemberDetailsTool, getLoanAccountsTool, searchTool } from './member-tools'
import { getTransactionsTool } from './transaction-tools'

export const agentTools = [
  getMemberDetailsTool,
  getLoanAccountsTool,
  getTransactionsTool,
  searchTool,
]

export { getMemberDetailsTool, getLoanAccountsTool, searchTool } from './member-tools'
export { getTransactionsTool } from './transaction-tools'

