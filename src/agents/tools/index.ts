/**
 * Agent Tools
 * Exports all tools available to the agent
 */

import { getMembersListTool } from "./member-list-tool";
import {
  getLoanAccountsTool,
  getMemberDetailsTool,
  searchTool,
} from "./member-tools";
import { getTransactionsTool } from "./transaction-tools";

export const agentTools = [
  getMemberDetailsTool,
  getLoanAccountsTool,
  getMembersListTool,
  getTransactionsTool,
  searchTool,
];

export { getMembersListTool } from "./member-list-tool";
export {
  getLoanAccountsTool,
  getMemberDetailsTool,
  searchTool,
} from "./member-tools";
export { getTransactionsTool } from "./transaction-tools";
