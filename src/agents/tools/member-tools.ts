/**
 * Member-related tools for the agent
 */

import { DynamicStructuredTool } from '@langchain/core/tools'
import { z } from 'zod'
import { getMemberDetails, getLoanAccounts, search } from '../../utils/api-client'
import { logger } from '../../utils/logger'

/**
 * Tool to get member details by username
 */
export const getMemberDetailsTool = new DynamicStructuredTool({
  name: 'get_member_details',
  description: `Get detailed information about a member by their username. Returns member account information, loan history, club statistics, and membership duration. Use this when the user asks about a specific member or wants member information.`,
  schema: z.object({
    username: z.string().describe('The username of the member to look up (e.g., "john.doe")'),
  }),
  func: async ({ username }) => {
    try {
      logger.debug(`Getting member details for username: ${username}`)
      const result = await getMemberDetails(username)
      return JSON.stringify(result, null, 2)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      logger.error(`Error getting member details: ${errorMessage}`)
      return `Error: ${errorMessage}`
    }
  },
})

/**
 * Tool to get all loan accounts
 */
export const getLoanAccountsTool = new DynamicStructuredTool({
  name: 'get_loan_accounts',
  description: `Get all member accounts with loan information, including active loans and loan history. Results are sorted by name and active status. Use this when the user asks about loans, loan accounts, or wants to see all members with loans.`,
  schema: z.object({}),
  func: async () => {
    try {
      logger.debug('Getting loan accounts')
      const result = await getLoanAccounts()
      return JSON.stringify(result, null, 2)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      logger.error(`Error getting loan accounts: ${errorMessage}`)
      return `Error: ${errorMessage}`
    }
  },
})

/**
 * Tool to search across members, vendors, loans, and transactions
 */
export const searchTool = new DynamicStructuredTool({
  name: 'search',
  description: `Search across members, vendors, loans, and transactions. Use this when the user wants to search for something but doesn't specify a particular member username, or when they want to find information across multiple entities.`,
  schema: z.object({
    query: z.string().describe('The search query string to search for'),
  }),
  func: async ({ query }) => {
    try {
      logger.debug(`Searching for: ${query}`)
      const result = await search(query)
      return JSON.stringify(result, null, 2)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      logger.error(`Error searching: ${errorMessage}`)
      return `Error: ${errorMessage}`
    }
  },
})

