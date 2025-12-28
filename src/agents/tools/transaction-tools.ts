/**
 * Transaction-related tools for the agent
 */

import { DynamicStructuredTool } from '@langchain/core/tools'
import { z } from 'zod'
import { getTransactions } from '../../utils/api-client'
import { logger } from '../../utils/logger'

/**
 * Tool to get transactions with optional filters
 */
export const getTransactionsTool = new DynamicStructuredTool({
  name: 'get_transactions',
  description: `Get a paginated list of transactions with filtering and sorting options. Use this when the user asks about transactions, transaction history, or wants to see financial records. You can filter by account, transaction type, date range, and sort by various fields.`,
  schema: z.object({
    page: z
      .number()
      .optional()
      .describe('Page number for pagination (default: 1)'),
    limit: z
      .number()
      .optional()
      .describe('Number of transactions per page (default: 10, max: 100)'),
    accountId: z
      .string()
      .optional()
      .describe('Filter by account ID (from or to)'),
    transactionType: z
      .enum([
        'DEPOSIT',
        'WITHDRAWAL',
        'LOAN',
        'LOAN_REPAYMENT',
        'INTEREST',
        'FEE',
        'TRANSFER',
        'LOAN_ALL',
      ])
      .optional()
      .describe('Filter by transaction type'),
    startDate: z
      .string()
      .optional()
      .describe('Start date for date range filter (format: YYYY-MM-DD)'),
    endDate: z
      .string()
      .optional()
      .describe('End date for date range filter (format: YYYY-MM-DD)'),
    sortField: z
      .enum(['occurredAt', 'createdAt', 'amount'])
      .optional()
      .describe('Field to sort by (default: occurredAt)'),
    sortOrder: z
      .enum(['asc', 'desc'])
      .optional()
      .describe('Sort order (default: desc)'),
  }),
  func: async (params) => {
    try {
      logger.debug('Getting transactions with filters:', params)
      const result = await getTransactions(params)
      return JSON.stringify(result, null, 2)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      logger.error(`Error getting transactions: ${errorMessage}`)
      return `Error: ${errorMessage}`
    }
  },
})

