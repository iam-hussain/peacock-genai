/**
 * Memory Module Types
 * Type definitions for finance memory store and vector store operations
 */

import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";

export type AccountLite = {
  id: string
  firstName: string
  lastName: string | null
  type: 'MEMBER' | 'VENDOR'
  status: 'ACTIVE' | 'INACTIVE' | 'BLOCKED' | 'CLOSED'
  email: string | null
  username: string
  phone: string | null
  accessLevel: 'READ' | 'WRITE' | 'ADMIN'
  role: 'SUPER_ADMIN' | 'ADMIN' | 'MEMBER'
  startedAt: Date
  createdAt: Date
}

export type TxLite = {
  id: string
  fromId: string
  toId: string
  amount: number
  currency: string
  type: string
  method: string
  occurredAt: Date
  referenceId: string | null
  description: string | null
  tags: string[]
  createdById: string | null
}

export type AccessLevel = 'READ' | 'WRITE' | 'ADMIN'

export interface BuildFinanceMemoryStoreOptions {
  monthsBack?: number
  maxTransactions?: number
}

export interface CreateFinanceAgentParams {
  store: MemoryVectorStore
  requesterAccountId?: string
  requesterAccessLevel?: AccessLevel
}

export interface FinanceMemoryStoreResult {
  store: MemoryVectorStore
  accById: Map<string, AccountLite>
  counts: {
    docs: number
    account: number
    tx: number
    month: number
  }
}

export interface MonthlySummaryBucket {
  memberId: string
  ym: string
  txs: TxLite[]
}

export interface FetchTransactionsParams {
  since?: Date
  limit?: number
}

