/**
 * Memory Store Manager
 * Singleton to manage the memory vector store instance
 */

import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";
import type { AccountLite } from '@/types/memory'

import { logger } from '@/utils/logger'

class MemoryStoreManager {
  private store: MemoryVectorStore | null = null
  private accById: Map<string, AccountLite> | null = null
  private initialized = false

  /**
   * Sets the memory store instance
   * @param store - Memory vector store
   * @param accById - Map of account IDs to accounts
   */
  setStore(store: MemoryVectorStore, accById: Map<string, AccountLite>): void {
    this.store = store
    this.accById = accById
    this.initialized = true
    logger.info('Memory store manager initialized')
  }

  /**
   * Gets the memory store instance
   * @returns Memory vector store or null if not initialized
   */
  getStore(): MemoryVectorStore | null {
    return this.store
  }

  /**
   * Gets the account map
   * @returns Map of account IDs to accounts or null if not initialized
   */
  getAccountMap(): Map<string, AccountLite> | null {
    return this.accById
  }

  /**
   * Checks if the store is initialized
   * @returns True if store is available
   */
  isInitialized(): boolean {
    return this.initialized && this.store !== null
  }

  /**
   * Resets the store (useful for testing or rebuilding)
   */
  reset(): void {
    this.store = null
    this.accById = null
    this.initialized = false
    logger.info('Memory store manager reset')
  }
}

declare global {
  // eslint-disable-next-line no-var
  var __memoryStoreManager: MemoryStoreManager | undefined
}

export const memoryStoreManager =
  globalThis.__memoryStoreManager ?? new MemoryStoreManager()

globalThis.__memoryStoreManager = memoryStoreManager

