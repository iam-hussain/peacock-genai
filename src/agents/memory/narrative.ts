import { Document } from '@langchain/core/documents'

import type { AccountLite, TxLite, MonthlySummaryBucket } from '@/types/memory'
import { DEFAULT_CURRENCY, DEFAULT_NOTABLE_TX_LIMIT } from '@/config/memory'
import { createMonthlySummaryDocument } from './documents'

/**
 * Formats an account into a display name for embeddings
 * @param account - Account to format
 * @returns Formatted display name
 */
export function displayName(account?: AccountLite): string {
  if (!account) return 'UNKNOWN'
  const name = `${account.firstName}${account.lastName ? ' ' + account.lastName : ''}`.trim()
  return `${account.type}(${name}, id=${account.id})`
}

/**
 * Creates a comprehensive narrative string for an account
 * Includes all relevant account details for better embeddings and searchability
 * @param account - Account to convert
 * @returns Detailed narrative string describing the account
 */
export function accountToNarrative(account: AccountLite): string {
  const name = `${account.firstName}${account.lastName ? ' ' + account.lastName : ''}`.trim()
  const email = account.email ? ` Email: ${account.email}.` : ''
  const phone = account.phone ? ` Phone: ${account.phone}.` : ''
  const startedDate = account.startedAt.toISOString().slice(0, 10)
  const createdDate = account.createdAt.toISOString().slice(0, 10)

  return (
    `ACCOUNT ${account.type}(${name}, id=${account.id}): ` +
    `Status=${account.status}. Role=${account.role}. AccessLevel=${account.accessLevel}. ` +
    `Username=${account.username}.${email}${phone} ` +
    `StartedAt=${startedDate}. CreatedAt=${createdDate}.`
  )
}

/**
 * Converts a transaction to a narrative string for embedding
 * @param tx - Transaction to convert
 * @param accById - Map of account IDs to accounts
 * @returns Narrative string describing the transaction
 */
export function txToNarrative(
  tx: TxLite,
  accById: Map<string, AccountLite>
): string {
  const date = tx.occurredAt.toISOString().slice(0, 10)
  const from = displayName(accById.get(tx.fromId))
  const to = displayName(accById.get(tx.toId))
  const ref = tx.referenceId ? ` Ref: ${tx.referenceId}.` : ''
  const tags = tx.tags?.length ? ` Tags: ${JSON.stringify(tx.tags)}.` : ''
  const note = tx.description ? ` Note: ${tx.description}.` : ''

  return `TX ${tx.type} on ${date}: ${tx.amount} ${tx.currency}. From ${from} to ${to}. Method ${tx.method}.${ref}${tags}${note}`
}

/**
 * Generates a month key from a date (YYYY-MM format)
 * @param date - Date to convert
 * @returns Month key string
 */
export function monthKey(date: Date): string {
  const y = date.getUTCFullYear()
  const m = String(date.getUTCMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

/**
 * Builds monthly summary documents for members
 * Creates high-value aggregated summaries with fewer vectors
 * @param transactions - Transactions to summarize
 * @param accById - Map of account IDs to accounts
 * @returns Array of Document objects for monthly summaries
 */
export function buildMonthlySummaries(
  transactions: TxLite[],
  accById: Map<string, AccountLite>
): Document[] {
  const bucket = new Map<string, MonthlySummaryBucket>()

  for (const tx of transactions) {
    const parties = [tx.fromId, tx.toId]
    for (const partyId of parties) {
      const account = accById.get(partyId)
      if (!account) continue

      // Only build summaries for MEMBER accounts
      if (account.type !== 'MEMBER') continue

      const ym = monthKey(tx.occurredAt)
      const key = `${partyId}:${ym}`
      if (!bucket.has(key)) {
        bucket.set(key, { memberId: partyId, ym, txs: [] })
      }
      bucket.get(key)!.txs.push(tx)
    }
  }

  const docs: Document[] = []

  for (const { memberId, ym, txs } of Array.from(bucket.values())) {
    const member = accById.get(memberId)
    if (!member) continue

    const currency = txs[0]?.currency ?? DEFAULT_CURRENCY

    const totalsByType = new Map<string, number>()
    let inflow = 0
    let outflow = 0

    for (const tx of txs) {
      totalsByType.set(tx.type, (totalsByType.get(tx.type) ?? 0) + tx.amount)

      // Heuristic: if member is "to", treat as inflow; if "from", outflow
      if (tx.toId === memberId) inflow += tx.amount
      if (tx.fromId === memberId) outflow += tx.amount
    }

    const notable = txs
      .filter(
        (t: TxLite) =>
          (t.description && t.description.length > 0) || (t.tags?.length ?? 0) > 0
      )
      .slice(0, DEFAULT_NOTABLE_TX_LIMIT)
      .map(
        (t: TxLite) =>
          `- ${t.type} ${t.amount} ${t.currency} on ${t.occurredAt.toISOString().slice(0, 10)}${t.description ? ` (${t.description})` : ''}`
      )
      .join('\n')

    const totalsStr = Array.from(totalsByType.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([t, sum]) => `${t}=${sum}`)
      .join(', ')

    const text =
      `MONTH SUMMARY ${ym} for ${displayName(member)}: ` +
      `TxCount=${txs.length}. Inflow=${inflow} ${currency}. Outflow=${outflow} ${currency}. ` +
      `TotalsByType: ${totalsStr}.` +
      (notable ? `\nNotable entries:\n${notable}` : '')

    docs.push(
      createMonthlySummaryDocument({
        memberId,
        yearMonth: ym,
        txCount: txs.length,
        inflow,
        outflow,
        currency,
        text,
      })
    )
  }

  return docs
}

