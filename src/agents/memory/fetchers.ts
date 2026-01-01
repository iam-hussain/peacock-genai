import prisma from '@/db'
import { logger } from '@/utils/logger'

import type { AccountLite, TxLite, FetchTransactionsParams } from '@/types/memory'
import { DEFAULT_MAX_TRANSACTIONS } from '@/config/memory'

/**
 * Fetches all accounts from the database
 * @returns Promise resolving to array of account lite objects
 * @throws Error if database query fails
 */
export async function fetchAccounts(): Promise<AccountLite[]> {
  try {
    const rows = await prisma.account.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        type: true,
        status: true,
        email: true,
        username: true,
        phone: true,
        accessLevel: true,
        role: true,
        startedAt: true,
        createdAt: true,
      },
    })

    return rows.map((row) => ({
      id: row.id,
      firstName: row.firstName,
      lastName: row.lastName,
      type: row.type as 'MEMBER' | 'VENDOR',
      status: row.status as 'ACTIVE' | 'INACTIVE' | 'BLOCKED' | 'CLOSED',
      email: row.email,
      username: row.username,
      phone: row.phone,
      accessLevel: row.accessLevel as 'READ' | 'WRITE' | 'ADMIN',
      role: row.role as 'SUPER_ADMIN' | 'ADMIN' | 'MEMBER',
      startedAt: row.startedAt,
      createdAt: row.createdAt,
    }))
  } catch (error) {
    logger.error('Failed to fetch accounts', { error })
    throw new Error('Failed to fetch accounts from database')
  }
}

/**
 * Fetches transactions from the database
 * @param params - Query parameters
 * @param params.since - Optional date to fetch transactions since
 * @param params.limit - Optional limit on number of transactions
 * @returns Promise resolving to array of transaction lite objects
 * @throws Error if database query fails
 */
export async function fetchTransactions(
  params: FetchTransactionsParams = {}
): Promise<TxLite[]> {
  try {
    const rows = await prisma.transaction.findMany({
      where: params.since ? { occurredAt: { gte: params.since } } : undefined,
      orderBy: { occurredAt: 'desc' },
      take: params.limit ?? DEFAULT_MAX_TRANSACTIONS,
      select: {
        id: true,
        fromId: true,
        toId: true,
        amount: true,
        currency: true,
        type: true,
        method: true,
        occurredAt: true,
        referenceId: true,
        description: true,
        tags: true,
        createdById: true,
      },
    })

    return rows.map((row) => ({
      id: row.id,
      fromId: row.fromId,
      toId: row.toId,
      amount: row.amount,
      currency: row.currency,
      type: row.type,
      method: row.method,
      occurredAt: row.occurredAt,
      referenceId: row.referenceId,
      description: row.description,
      tags: row.tags ?? [],
      createdById: row.createdById,
    }))
  } catch (error) {
    logger.error('Failed to fetch transactions', { error, params })
    throw new Error('Failed to fetch transactions from database')
  }
}

