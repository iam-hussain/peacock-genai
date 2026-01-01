/**
 * Memory search tools for the agent
 * Provides semantic search over the finance memory store
 */

import { DynamicStructuredTool } from '@langchain/core/tools'
import { z } from 'zod'
import type { Document } from '@langchain/core/documents'

import { logger } from '@/utils/logger'
import { memoryStoreManager } from '../memory/store-manager'
import {
    DEFAULT_MAX_RETRIEVAL_K,
    DEFAULT_MIN_RETRIEVAL,
    DEFAULT_RETRIEVAL_MULTIPLIER,
} from '@/config/memory'

/**
 * Tool to search the finance memory store semantically
 * Searches across accounts, transactions, and monthly summaries
 */
// @ts-ignore - TypeScript has issues with deep type inference in DynamicStructuredTool with Zod schemas
export const searchMemoryTool = new (DynamicStructuredTool as any)({
    name: 'search_finance_memory',
    description: `Search the finance memory store using semantic search. Use this when the user asks about accounts, transaction history, financial patterns, member information, or any finance-related queries. This tool searches across accounts, transactions, and monthly summaries using natural language queries.`,
    schema: z.object({
        query: z.string().min(1).describe('Natural language query to search for'),
        k: z.number().min(1).max(DEFAULT_MAX_RETRIEVAL_K).optional().default(6),
    }),
    func: async (input: { query: string; k?: number }): Promise<string> => {
        const { query, k = 6 } = input
        try {
            const store = memoryStoreManager.getStore()

            if (!store) {
                logger.warn('Memory store not initialized, returning error message')
                return 'Memory store is not available. Please wait for initialization or contact support.'
            }

            logger.debug('Searching memory store', { query, k })

            // Retrieve more than needed, then limit to k
            const raw = await store.similaritySearch(
                query,
                Math.max(k * DEFAULT_RETRIEVAL_MULTIPLIER, DEFAULT_MIN_RETRIEVAL)
            )

            // Limit to requested number of results
            const results = raw.slice(0, k)

            if (results.length === 0) {
                return 'No relevant results found in the memory store for your query.'
            }

            // Format results for the agent
            const formatted = results
                .map((doc: Document, i: number) => {
                    const meta = doc.metadata ?? {}
                    const docType = meta.docType || 'unknown'

                    let label = ''
                    if (docType === 'account') {
                        label = `ACCOUNT ${meta.accountType || 'UNKNOWN'} id=${meta.accountId}`
                    } else if (docType === 'month_summary') {
                        label = `MONTH SUMMARY ${meta.yearMonth || 'UNKNOWN'} member=${meta.memberId}`
                    } else if (docType === 'tx') {
                        label = `TRANSACTION ${meta.type || 'UNKNOWN'} id=${meta.txId}`
                    } else {
                        label = `DOCUMENT ${docType}`
                    }

                    return `[#${i + 1} ${label}]\n${doc.pageContent}`
                })
                .join('\n\n---\n\n')

            logger.debug('Memory search completed', {
                query,
                requested: k,
                returned: results.length,
            })

            return formatted
        } catch (error) {
            const errorMessage =
                error instanceof Error ? error.message : String(error)
            logger.error(`Error searching memory store: ${errorMessage}`, { error, query, k })
            return `Error searching memory store: ${errorMessage}`
        }
    },
})

