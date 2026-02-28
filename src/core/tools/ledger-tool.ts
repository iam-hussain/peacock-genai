/**
 * Financial Ledger & Analytics Tools
 * Moving money and transaction auditing
 */

import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";

import { peacockFetch } from "@/lib/auth";

const TRANSACTION_TYPES = [
  "DEPOSIT",
  "WITHDRAWAL",
  "LOAN",
  "LOAN_REPAYMENT",
  "INTEREST",
  "FEE",
  "TRANSFER",
  "LOAN_ALL",
] as const;

export function createLedgerTools() {
  return [
    new DynamicStructuredTool({
      name: "fetch_transactions",
      description:
        "List transactions with filtering. Use for auditing, viewing financial history by type, account, or date range.",
      schema: z.object({
        type: z
          .string()
          .optional()
          .describe(
            `Transaction type: ${TRANSACTION_TYPES.slice(0, -1).join(", ")}`
          ),
        accountId: z
          .string()
          .optional()
          .describe("Filter by account ID (from or to)"),
        startDate: z.string().optional().describe("Start date (YYYY-MM-DD)"),
        endDate: z.string().optional().describe("End date (YYYY-MM-DD)"),
        limit: z
          .number()
          .optional()
          .default(20)
          .describe("Number of transactions to return"),
        page: z.number().optional().default(1).describe("Page number"),
        sortField: z
          .enum(["occurredAt", "createdAt", "amount"])
          .optional()
          .default("occurredAt")
          .describe("Sort field"),
        sortOrder: z
          .enum(["asc", "desc"])
          .optional()
          .default("desc")
          .describe("Sort order"),
      }),
      func: async ({
        type,
        accountId,
        startDate,
        endDate,
        limit,
        page,
        sortField,
        sortOrder,
      }) => {
        try {
          const params = new URLSearchParams();
          params.append("limit", String(limit));
          params.append("page", String(page ?? 1));
          if (accountId) params.append("accountId", accountId);
          if (type) params.append("transactionType", type);
          if (startDate) params.append("startDate", startDate);
          if (endDate) params.append("endDate", endDate);
          if (sortField) params.append("sortField", sortField);
          if (sortOrder) params.append("sortOrder", sortOrder);

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
          return `Error fetching transactions: ${msg}`;
        }
      },
    }),

    new DynamicStructuredTool({
      name: "execute_transaction",
      description:
        "Creates a single financial movement (Deposit, Loan Repay, Withdrawal, etc.). Use for one transaction.",
      schema: z.object({
        fromId: z.string().describe("Source account ID"),
        toId: z.string().describe("Destination account ID"),
        amount: z.number().positive().describe("Amount to transfer"),
        type: z
          .string()
          .describe(
            `Transaction type: ${TRANSACTION_TYPES.slice(0, -1).join(", ")}`
          ),
        method: z
          .string()
          .default("ACCOUNT")
          .describe("Payment method (ACCOUNT, CASH, CARD, UPI)"),
        description: z.string().optional().describe("Description or note"),
        occurredAt: z
          .string()
          .optional()
          .describe("Date of transaction (ISO string, defaults to now)"),
      }),
      func: async (payload) => {
        try {
          const body = {
            fromId: payload.fromId,
            toId: payload.toId,
            amount: payload.amount,
            transactionType: payload.type,
            method: payload.method,
            description: payload.description,
            occurredAt: payload.occurredAt,
          };

          const response = await peacockFetch("/api/transaction/create", {
            method: "POST",
            body: JSON.stringify(body),
          });

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API Error ${response.status}: ${errorText}`);
          }

          const data = await response.json();
          return JSON.stringify(data);
        } catch (error: unknown) {
          const msg = error instanceof Error ? error.message : String(error);
          return `Error executing transaction: ${msg}`;
        }
      },
    }),

    new DynamicStructuredTool({
      name: "execute_transactions",
      description:
        "Creates one or multiple transactions in sequence. Use when user says 'add transaction', 'create 3 transactions', 'add multiple deposits'. Each transaction needs fromId, toId, amount, type. Returns result for each.",
      schema: z.object({
        transactions: z
          .array(
            z.object({
              fromId: z.string().describe("Source account ID"),
              toId: z.string().describe("Destination account ID"),
              amount: z.number().positive().describe("Amount to transfer"),
              type: z
                .string()
                .describe(
                  `Transaction type: ${TRANSACTION_TYPES.slice(0, -1).join(", ")}`
                ),
              method: z
                .string()
                .default("ACCOUNT")
                .optional()
                .describe("Payment method (ACCOUNT, CASH, CARD, UPI)"),
              description: z
                .string()
                .optional()
                .describe("Description or note"),
              occurredAt: z
                .string()
                .optional()
                .describe("Date (ISO string, defaults to now)"),
            })
          )
          .min(1)
          .max(20)
          .describe(
            "Array of 1 to 20 transactions. Use 1 item for single transaction, multiple for batch."
          ),
      }),
      func: async ({ transactions }) => {
        const results: Array<{
          index: number;
          success: boolean;
          data?: unknown;
          error?: string;
        }> = [];

        for (let i = 0; i < transactions.length; i++) {
          const t = transactions[i];
          if (!t) continue;
          try {
            const body = {
              fromId: t.fromId,
              toId: t.toId,
              amount: t.amount,
              transactionType: t.type,
              method: t.method ?? "ACCOUNT",
              description: t.description,
              occurredAt: t.occurredAt,
            };

            const response = await peacockFetch("/api/transaction/create", {
              method: "POST",
              body: JSON.stringify(body),
            });

            if (!response.ok) {
              const errorText = await response.text();
              results.push({
                index: i + 1,
                success: false,
                error: `API ${response.status}: ${errorText}`,
              });
              continue;
            }

            const data = await response.json();
            results.push({ index: i + 1, success: true, data });
          } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : String(error);
            results.push({ index: i + 1, success: false, error: msg });
          }
        }

        const succeeded = results.filter((r) => r.success).length;
        const failed = results.filter((r) => !r.success).length;

        return JSON.stringify({
          total: transactions.length,
          succeeded,
          failed,
          results,
        });
      },
    }),
  ];
}
