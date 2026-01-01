import "server-only";

import { logger } from '@/utils/logger'

import { buildFinanceMemoryStore } from './memory-store'
import { memoryStoreManager } from './store-manager'

/**
 * Initializes the finance memory store and agent on server startup
 * This should be called once when the server starts
 */
export async function bootstrapFinanceMemory(): Promise<void> {
    try {
        logger.info('Building MemoryVectorStore from DB...')
        const { store, accById, counts } = await buildFinanceMemoryStore()
        logger.info('Index built', counts)

        // Store the memory store in the manager for tool access
        memoryStoreManager.setStore(store, accById)

        logger.info('Finance memory store initialized successfully')
        return
    } catch (error) {
        logger.error('Failed to bootstrap finance memory', { error })
        throw error
    }
}

/**
 * Initializes the finance memory store on server startup
 * This function is idempotent - it will only initialize once
 * @returns Promise that resolves when initialization is complete
 */
let initialized = false
let initPromise: Promise<void> | null = null

export async function initializeFinanceMemory(): Promise<void> {
    if (initialized) {
        return
    }

    if (initPromise) {
        return initPromise
    }

    initPromise = (async () => {
        try {
            await bootstrapFinanceMemory()
            initialized = true
            logger.info('Finance memory store initialized successfully')
        } catch (error) {
            logger.error('Failed to initialize finance memory store', { error })
            // Don't throw - allow server to start even if memory store fails
            // The store can be built on-demand later
        } finally {
            initPromise = null
        }
    })()

    return initPromise
}

