import { Document } from '@langchain/core/documents'

import type { AccountLite, TxLite } from '@/types/memory'
import { txToNarrative, accountToNarrative } from './narrative'

/**
 * Creates a Document for an account
 * @param account - Account to create document for
 * @returns Document object for the account
 */
export function createAccountDocument(account: AccountLite): Document {
    return new Document({
        pageContent: accountToNarrative(account),
        metadata: {
            docType: 'account',
            accountId: account.id,
            accountType: account.type,
            status: account.status,
            role: account.role,
            accessLevel: account.accessLevel,
            username: account.username,
            email: account.email ?? null,
            phone: account.phone ?? null,
            startedAt: account.startedAt.toISOString(),
            createdAt: account.createdAt.toISOString(),
        },
    })
}

/**
 * Creates a Document for a transaction
 * @param tx - Transaction to create document for
 * @param accById - Map of account IDs to accounts
 * @returns Document object for the transaction
 */
export function createTransactionDocument(
    tx: TxLite,
    accById: Map<string, AccountLite>
): Document {
    return new Document({
        pageContent: txToNarrative(tx, accById),
        metadata: {
            docType: 'tx',
            txId: tx.id,
            fromId: tx.fromId,
            toId: tx.toId,
            partyIds: [tx.fromId, tx.toId],
            type: tx.type,
            method: tx.method,
            occurredAt: tx.occurredAt.toISOString(),
            occurredAtTs: tx.occurredAt.getTime(),
            amount: tx.amount,
            currency: tx.currency,
            tags: tx.tags ?? [],
            referenceId: tx.referenceId ?? null,
            createdById: tx.createdById ?? null,
        },
    })
}

/**
 * Creates a Document for a monthly summary
 * @param params - Monthly summary parameters
 * @param params.memberId - Member account ID
 * @param params.yearMonth - Year-month string (YYYY-MM)
 * @param params.txCount - Number of transactions
 * @param params.inflow - Total inflow amount
 * @param params.outflow - Total outflow amount
 * @param params.currency - Currency code
 * @param params.text - Summary text content
 * @returns Document object for the monthly summary
 */
export function createMonthlySummaryDocument(params: {
    memberId: string
    yearMonth: string
    txCount: number
    inflow: number
    outflow: number
    currency: string
    text: string
}): Document {
    return new Document({
        pageContent: params.text,
        metadata: {
            docType: 'month_summary',
            memberId: params.memberId,
            yearMonth: params.yearMonth,
            txCount: params.txCount,
            inflow: params.inflow,
            outflow: params.outflow,
            currency: params.currency,
        },
    })
}

