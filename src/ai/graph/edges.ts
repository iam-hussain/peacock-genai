/**
 * Conditional routing logic and guardrails
 */

import type { AgentState } from "./state";

/** Route from supervisor to the chosen agent or end */
export function routeFromSupervisor(state: AgentState): string {
  const next = state.next ?? "supervisor";
  if (next === "__end__" || next === "FINISH") {
    return "end";
  }
  return next;
}

/** Check if last message has tool calls -> route to call_tool, else supervisor */
export function routeAfterAgent(state: AgentState): string {
  const messages = state.messages;
  const lastMessage = messages[messages.length - 1];

  if (
    lastMessage &&
    "tool_calls" in lastMessage &&
    Array.isArray(lastMessage.tool_calls) &&
    lastMessage.tool_calls.length > 0
  ) {
    return "call_tool";
  }

  return "supervisor";
}

/** Route after call_tool back to the agent that invoked the tool */
export function routeAfterCallTool(state: AgentState): string {
  return state.currentAgent ?? "supervisor";
}

/**
 * Auth check: if finance_agent requested execute_transaction and accessLevel
 * is not WRITE or ADMIN, route to error. (Placeholder - always allow for now)
 */
export function shouldAllowFinanceTool(state: AgentState): boolean {
  const auth = state.auth;
  if (!auth) return true;
  const level = auth.accessLevel ?? "READ";
  return level === "WRITE" || level === "ADMIN";
}
