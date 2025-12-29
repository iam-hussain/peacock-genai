/**
 * Tool to get all members with loan information formatted as a list
 */

import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";

import { getLoanAccounts } from "../../utils/api-client";
import { logger } from "../../utils/logger";

interface LoanHistoryItem {
  amount?: number;
  balance?: number;
  status?: string;
  type?: string;
}

interface LoanAccount {
  id: string;
  name: string;
  active: boolean;
  loanBalance?: number;
  currentLoanBalance?: number;
  balance?: number;
  loanHistory?: LoanHistoryItem[];
}

interface LoanAccountsResponse {
  accounts?: LoanAccount[];
}

/**
 * Calculate current loan balance from loan history
 */
function calculateLoanBalance(account: LoanAccount): number {
  // Try direct balance fields first
  if (account.loanBalance !== undefined && account.loanBalance !== null) {
    return account.loanBalance;
  }
  if (
    account.currentLoanBalance !== undefined &&
    account.currentLoanBalance !== null
  ) {
    return account.currentLoanBalance;
  }
  if (account.balance !== undefined && account.balance !== null) {
    return account.balance;
  }

  // Calculate from loan history if available
  if (account.loanHistory && account.loanHistory.length > 0) {
    // Find the most recent active loan
    const activeLoans = account.loanHistory.filter(
      (loan) => loan.status === "ACTIVE" || loan.status === "active"
    );
    if (activeLoans.length > 0) {
      const latestLoan = activeLoans[activeLoans.length - 1];
      return latestLoan.balance ?? latestLoan.amount ?? 0;
    }

    // If no active loans, return 0
    return 0;
  }

  return 0;
}

/**
 * Tool to get all members with loan balances formatted as a list
 * Returns all members, not just a subset
 */
export const getMembersListTool = new DynamicStructuredTool({
  name: "get_members_list",
  description: `Get ALL members with their status and optionally loan balances. Returns a formatted list of all members. Use this when the user asks for "list members", "show all members", or "members list". 
  
  IMPORTANT: 
  - If user asks for just "members", "list members", or "show members" → set includeLoanBalance=false (show only names and status)
  - If user specifically asks for loan information, balances, or financial details → set includeLoanBalance=true
  - This tool returns ALL members, not a subset. Always use this tool instead of base context to get complete member lists.`,
  schema: z.object({
    includeInactive: z
      .boolean()
      .optional()
      .describe("Whether to include inactive members (default: true)"),
    includeLoanBalance: z
      .boolean()
      .optional()
      .describe(
        "Whether to include loan balance information. Set to false for simple member lists (default: false for basic member queries, true only when user specifically asks for loan/financial information)"
      ),
  }),
  func: async ({ includeInactive = true, includeLoanBalance = false }) => {
    try {
      logger.debug("Getting all members with loan information");
      const result = (await getLoanAccounts()) as LoanAccountsResponse;

      if (!result || !result.accounts || result.accounts.length === 0) {
        return "No members found.";
      }

      // Format as markdown list for UI rendering
      const members = result.accounts
        .filter((account) => includeInactive || account.active)
        .map((account) => {
          const name = account.name || "Unknown";
          const status = account.active ? "Active" : "Inactive";

          if (includeLoanBalance) {
            const loanBalance = calculateLoanBalance(account);
            const formattedBalance = loanBalance.toLocaleString("en-IN");
            return `- ${name} - ${status}, Loan Balance: ${formattedBalance}`;
          } else {
            // Simple format: just name and status
            return `- ${name} - ${status}`;
          }
        });

      // Return as markdown list (will be automatically converted to list UI)
      return members.join("\n");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      logger.error(`Error getting members list: ${errorMessage}`);
      return `Error: ${errorMessage}`;
    }
  },
});
