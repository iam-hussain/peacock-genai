/**
 * Central Tool Registry
 * Aligned with Peacock GenAI Tool & Endpoint Plan
 */

import type { StructuredToolInterface } from "@langchain/core/tools";

import { createAccountTools } from "./account-tool";
import { createAnalyticsTools } from "./analytics-tool";
import { createLedgerTools } from "./ledger-tool";
import { createLoanTools } from "./loan-tool";
import { createVendorTools } from "./vendor-tool";

export { createAccountTools } from "./account-tool";
export { createAnalyticsTools } from "./analytics-tool";
export { createLedgerTools } from "./ledger-tool";
export { createLoanTools } from "./loan-tool";
export { createTransactionTools } from "./transaction-tool";
export { createVendorTools } from "./vendor-tool";

/**
 * All tools for the agent
 * Account, Loan, Vendor, Ledger, Analytics
 */
export function getAllTools(): StructuredToolInterface[] {
  return [
    ...createAccountTools(),
    ...createLoanTools(),
    ...createVendorTools(),
    ...createLedgerTools(),
    ...createAnalyticsTools(),
  ];
}
