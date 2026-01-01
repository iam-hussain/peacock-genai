/**
 * Transaction-related tools for the agent
 */

import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";

import {
  createTransaction,
  deleteTransaction,
  getTransactions,
} from "../../utils/api-client";
import { logger } from "../../utils/logger";

/**
 * Tool to get transactions with optional filters
 */
export const getTransactionsTool = new DynamicStructuredTool({
  name: "get_transactions",
  description: `Get a paginated list of transactions with filtering and sorting options. Use this when the user asks about transactions, transaction history, or wants to see financial records. You can filter by account, transaction type, date range, and sort by various fields.`,
  schema: z.object({
    page: z
      .number()
      .optional()
      .describe("Page number for pagination (default: 1)"),
    limit: z
      .number()
      .optional()
      .describe("Number of transactions per page (default: 10, max: 100)"),
    accountId: z
      .string()
      .optional()
      .describe("Filter by account ID (from or to)"),
    transactionType: z
      .enum([
        "DEPOSIT",
        "WITHDRAWAL",
        "LOAN",
        "LOAN_REPAYMENT",
        "INTEREST",
        "FEE",
        "TRANSFER",
        "LOAN_ALL",
      ])
      .optional()
      .describe("Filter by transaction type"),
    startDate: z
      .string()
      .optional()
      .describe("Start date for date range filter (format: YYYY-MM-DD)"),
    endDate: z
      .string()
      .optional()
      .describe("End date for date range filter (format: YYYY-MM-DD)"),
    sortField: z
      .enum(["occurredAt", "createdAt", "amount"])
      .optional()
      .describe("Field to sort by (default: occurredAt)"),
    sortOrder: z
      .enum(["asc", "desc"])
      .optional()
      .describe("Sort order (default: desc)"),
  }),
  func: async (params) => {
    try {
      logger.debug("Getting transactions with filters:", params);
      const result = await getTransactions(params);
      return JSON.stringify(result, null, 2);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      logger.error(`Error getting transactions: ${errorMessage}`);
      return `Error: ${errorMessage}`;
    }
  },
});

/**
 * Tool to create a new transaction
 */
export const createTransactionTool = new DynamicStructuredTool({
  name: "create_transaction",
  description: `Create a new financial transaction between accounts. Use this when the user wants to create a deposit, withdrawal, loan, loan repayment, interest payment, fee, or transfer. Requires write access.`,
  schema: z.object({
    fromId: z
      .string()
      .describe("Source account ID (the account sending money)"),
    toId: z
      .string()
      .describe("Destination account ID (the account receiving money)"),
    amount: z
      .number()
      .positive()
      .describe("Transaction amount (must be positive, minimum 0.01)"),
    transactionType: z
      .enum([
        "DEPOSIT",
        "WITHDRAWAL",
        "LOAN",
        "LOAN_REPAYMENT",
        "INTEREST",
        "FEE",
        "TRANSFER",
      ])
      .describe("Type of transaction"),
    occurredAt: z
      .string()
      .optional()
      .describe(
        "Transaction timestamp in ISO format (YYYY-MM-DDTHH:mm:ssZ). Defaults to current time if not provided."
      ),
    description: z
      .string()
      .optional()
      .describe("Optional transaction description or notes"),
  }),
  func: async (params) => {
    try {
      logger.debug("Creating transaction:", params);
      const result = await createTransaction(params);
      return JSON.stringify(result, null, 2);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      logger.error(`Error creating transaction: ${errorMessage}`);
      return `Error: ${errorMessage}`;
    }
  },
});

/**
 * Tool to delete a transaction by ID
 */
export const deleteTransactionTool = new DynamicStructuredTool({
  name: "delete_transaction",
  description: `Delete a transaction by its ID. Use this when the user wants to remove or cancel a specific transaction. Requires write access.`,
  schema: z.object({
    transactionId: z
      .string()
      .describe("The ID of the transaction to delete"),
  }),
  func: async ({ transactionId }) => {
    try {
      logger.debug(`Deleting transaction: ${transactionId}`);
      const result = await deleteTransaction(transactionId);
      return JSON.stringify(result, null, 2);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      logger.error(`Error deleting transaction: ${errorMessage}`);
      return `Error: ${errorMessage}`;
    }
  },
});
