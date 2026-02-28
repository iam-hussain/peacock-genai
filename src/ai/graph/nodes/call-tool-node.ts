/**
 * Call Tool Node - Executor
 * Generic node that executes tool calls from any agent
 */

import { ToolNode } from "@langchain/langgraph/prebuilt";

import {
  createAccountTools,
  createAnalyticsTools,
  createLedgerTools,
  createLoanTools,
  createVendorTools,
} from "@/core/tools";

export function createCallToolNode() {
  const tools = [
    ...createAccountTools(),
    ...createLoanTools(),
    ...createVendorTools(),
    ...createLedgerTools(),
    ...createAnalyticsTools(),
  ];

  return new ToolNode(tools);
}
