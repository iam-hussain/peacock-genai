import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";

import { peacockFetch } from "@/lib/auth";

export function createTransactionTools() {
  return [
    new DynamicStructuredTool({
      name: "list_transactions",
      description:
        "List transactions with optional filtering. Use this to view financial history.",
      schema: z.object({
        limit: z
          .number()
          .optional()
          .describe("Number of transactions to return"),
        accountId: z
          .string()
          .optional()
          .describe("Filter by account ID (from or to)"),
        type: z
          .string()
          .optional()
          .describe("Filter by transaction type (DEPOSIT, WITHDRAWAL, etc.)"),
        startDate: z
          .string()
          .optional()
          .describe("Start date (YYYY-MM-DD or ISO)"),
        endDate: z.string().optional().describe("End date (YYYY-MM-DD or ISO)"),
        page: z.number().optional().describe("Page number (default 1)"),
        sortField: z
          .enum(["occurredAt", "createdAt", "amount"])
          .optional()
          .describe("Field to sort by (default occurredAt)"),
        sortOrder: z
          .enum(["asc", "desc"])
          .optional()
          .describe("Sort order (default desc)"),
      }),
      func: async ({
        limit,
        accountId,
        type,
        startDate,
        endDate,
        page,
        sortField,
        sortOrder,
      }) => {
        try {
          const params = new URLSearchParams();
          if (limit) params.append("limit", limit.toString());
          if (accountId) params.append("accountId", accountId);
          if (type) params.append("transactionType", type);
          if (startDate) params.append("startDate", startDate);
          if (endDate) params.append("endDate", endDate);
          if (page) params.append("page", page.toString());
          if (sortField) params.append("sortField", sortField);
          if (sortOrder) params.append("sortOrder", sortOrder);

          const response = await peacockFetch(
            `/api/transaction?${params.toString()}`,
            { method: "POST" }
          );

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API Error ${response.status}: ${errorText}`);
          }

          const data = await response.json();
          return JSON.stringify(data);
        } catch (error: unknown) {
          const msg = error instanceof Error ? error.message : String(error);
          return `Error listing transactions: ${msg}`;
        }
      },
    }),

    new DynamicStructuredTool({
      name: "create_transaction",
      description: "Create a new financial transaction.",
      schema: z.object({
        fromId: z.string().describe("Source account ID"),
        toId: z.string().describe("Destination account ID"),
        amount: z.number().positive().describe("Amount to transfer"),
        type: z
          .string()
          .describe("Type of transaction (DEPOSIT, WITHDRAWAL, etc.)"),
        method: z
          .string()
          .default("ACCOUNT")
          .describe("Payment method (ACCOUNT, CASH, etc.)"),
        description: z.string().optional().describe("Description or note"),
        occurredAt: z
          .string()
          .optional()
          .describe("Date of transaction (ISO string)"),
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
          return `Error creating transaction: ${msg}`;
        }
      },
    }),
  ];
}
