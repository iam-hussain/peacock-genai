import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";
import { OpenAIEmbeddings } from '@langchain/openai'

import { logger } from '@/utils/logger'

import type {
    FinanceMemoryStoreResult,
    AccountLite,
} from '@/types/memory'
import {
    DEFAULT_EMBEDDING_MODEL,
} from '@/config/memory'
import { fetchAccounts, fetchTransactions } from './fetchers'
import { buildMonthlySummaries } from './narrative'
import { createAccountDocument, createTransactionDocument } from './documents'

/**
 * Builds a MemoryVectorStore from financial data in the database
 * Creates embeddings from transactions and monthly summaries for semantic search
 *
 * @param opts - Configuration options
 * @param opts.monthsBack - Number of months to look back (default: 18)
 * @param opts.maxTransactions - Maximum number of transactions to process (default: 20000)
 * @returns Promise resolving to store, account map, and counts
 * @throws Error if store creation fails
 */
export async function buildFinanceMemoryStore(
): Promise<FinanceMemoryStoreResult> {
    try {
        const [accounts, transactions] = await Promise.all([
            fetchAccounts(),
            fetchTransactions(),
        ])

        logger.info('Fetched data', {
            accountCount: accounts.length,
            transactionCount: transactions.length,
        })

        const accById = new Map<string, AccountLite>(
            accounts.map((a) => [a.id, a])
        )

        // 1) Account docs
        const accountDocs = accounts.map((account) =>
            createAccountDocument(account)
        )

        // 2) Transaction docs
        const txDocs = transactions.map((tx) =>
            createTransactionDocument(tx, accById)
        )

        // 3) Monthly summaries (high-value, fewer vectors)
        const monthDocs = buildMonthlySummaries(transactions, accById)

        const docs = [...accountDocs, ...monthDocs, ...txDocs]

        logger.info('Creating embeddings', {
            totalDocs: docs.length,
            accountDocs: accountDocs.length,
            txDocs: txDocs.length,
            monthDocs: monthDocs.length,
        })

        const embeddings = new OpenAIEmbeddings({
            model: DEFAULT_EMBEDDING_MODEL,
        })
        const store = await MemoryVectorStore.fromDocuments(docs, embeddings)

        logger.info('Memory store built successfully', {
            docCount: docs.length,
            accountCount: accountDocs.length,
            txCount: txDocs.length,
            monthCount: monthDocs.length,
        })

        return {
            store,
            accById,
            counts: {
                docs: docs.length,
                account: accountDocs.length,
                tx: txDocs.length,
                month: monthDocs.length,
            },
        }
    } catch (error) {
        logger.error('Failed to build finance memory store', { error })
        throw error
    }
}

