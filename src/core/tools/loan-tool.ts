/**
 * Member Loan Tools
 * Debt, interest, and repayment history
 */

import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";

import { peacockFetch } from "@/lib/auth";

interface LoanAccount {
  id: string;
  name?: string;
  active?: boolean;
  loanHistory?: unknown[];
  interestBalance?: number;
  currentLoanTaken?: number;
  [key: string]: unknown;
}

export function createLoanTools() {
  return [
    new DynamicStructuredTool({
      name: "fetch_loan_registry",
      description:
        "Lists all loan accounts with full details: name, interestBalance, currentLoanTaken, loanHistory (amount, date, type). Use for: 'Who has active loans?', 'List closed loans'. Always return all available fields for each account.",
      schema: z.object({
        scope: z
          .enum(["ACTIVE", "CLOSED", "ALL"])
          .default("ALL")
          .describe(
            "Filter: ACTIVE (interestBalance > 0), CLOSED (no active balance), or ALL"
          ),
      }),
      func: async ({ scope }) => {
        try {
          const response = await peacockFetch("/api/account/loan", {
            method: "POST",
            body: JSON.stringify({}),
          });

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API Error ${response.status}: ${errorText}`);
          }

          const data = (await response.json()) as {
            accounts?: LoanAccount[];
          };
          const accounts = data.accounts ?? [];

          let filtered: LoanAccount[];
          if (scope === "ALL") {
            filtered = accounts;
          } else if (scope === "ACTIVE") {
            filtered = accounts.filter((a) => a.active === true);
          } else {
            filtered = accounts.filter((a) => a.active !== true);
          }

          return JSON.stringify({
            count: filtered.length,
            scope,
            accounts: filtered.map((a) => ({
              id: a.id,
              name: a.name,
              active: a.active,
              interestBalance: a.interestBalance,
              currentLoanTaken: a.currentLoanTaken,
              loanHistory: a.loanHistory,
              loanHistoryCount: a.loanHistory?.length ?? 0,
            })),
          });
        } catch (error: unknown) {
          const msg = error instanceof Error ? error.message : String(error);
          return `Error fetching loan registry: ${msg}`;
        }
      },
    }),

    new DynamicStructuredTool({
      name: "get_loan_statement",
      description:
        "Retrieves detailed loan transactions (LOAN, LOAN_REPAYMENT, INTEREST). Returns amount, occurredAt, type, from/to for each transaction. Use with accountId to get full statement for a specific member.",
      schema: z.object({
        accountId: z
          .string()
          .optional()
          .describe("Filter by account ID (from or to)"),
        limit: z
          .number()
          .optional()
          .default(50)
          .describe("Number of transactions to return"),
        page: z.number().optional().default(1).describe("Page number"),
      }),
      func: async ({ accountId, limit, page }) => {
        try {
          const params = new URLSearchParams();
          params.append("transactionType", "LOAN_ALL");
          params.append("limit", String(limit));
          params.append("page", String(page ?? 1));
          if (accountId) params.append("accountId", accountId);

          const response = await peacockFetch(
            `/api/transaction?${params.toString()}`,
            {
              method: "POST",
              body: JSON.stringify({}),
            }
          );

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API Error ${response.status}: ${errorText}`);
          }

          const data = await response.json();
          return JSON.stringify(data);
        } catch (error: unknown) {
          const msg = error instanceof Error ? error.message : String(error);
          return `Error fetching loan statement: ${msg}`;
        }
      },
    }),
  ];
}
