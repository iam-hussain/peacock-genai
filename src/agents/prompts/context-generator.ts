/**
 * Context Prompt Generator
 * Generates context prompts from base-info.json for the agent
 */

import fs from 'fs/promises'
import path from 'path'
import { logger } from '../../utils/logger'

interface BaseInfo {
    member?: Array<{
        id: string
        username: string
        firstName: string
        lastName?: string | null
        phone?: string | null
        email?: string | null
        role: string
        status: string
        active: boolean
        accessLevel: string
        startedAt?: string
        avatarUrl?: string | null
    }>
    vendor?: Array<{
        id: string
        username: string
        firstName: string
        lastName?: string | null
        active: boolean
        startedAt?: string
        endedAt?: string | null
    }>
    clubConfig?: {
        startedAt?: string
        stages?: Array<{
            name: string
            amount: number
            startDate: string
            endDate?: string
        }>
        alpha?: {
            name: string
            amount: number
            startDate: string
            endDate?: string
        }
        bravo?: {
            name: string
            amount: number
            startDate: string
        }
        dayInterestFrom?: string
    }
    clubData?: {
        sub?: string
        avatar?: string
    }
    transactionTypeMap?: Record<string, string>
    transactionTypeHumanMap?: Record<string, string>
}

/**
 * Load base info data from JSON file
 */
async function loadBaseInfo(): Promise<BaseInfo | null> {
    try {
        const filePath = path.join(process.cwd(), 'src/data/base-info.json')
        const fileContent = await fs.readFile(filePath, 'utf-8')
        return JSON.parse(fileContent) as BaseInfo
    } catch (error) {
        logger.warn('Failed to load base-info.json:', error instanceof Error ? error.message : String(error))
        return null
    }
}

/**
 * Generate member summary for context
 */
function generateMemberSummary(members: BaseInfo['member']): string {
    if (!members || members.length === 0) {
        return 'No members found.'
    }

    const activeMembers = members.filter((m) => m.active && m.status === 'ACTIVE')
    const inactiveMembers = members.filter((m) => !m.active || m.status === 'INACTIVE')
    const admins = members.filter((m) => m.role === 'ADMIN')
    const writeAccess = members.filter((m) => m.accessLevel === 'WRITE')

    let summary = `**Members Overview:**\n`
    summary += `- Total members: ${members.length}\n`
    summary += `- Active members: ${activeMembers.length}\n`
    summary += `- Inactive members: ${inactiveMembers.length}\n`
    summary += `- Admin members: ${admins.length}\n`
    summary += `- Members with write access: ${writeAccess.length}\n\n`

    summary += `**Active Members (${activeMembers.length}):**\n`
    activeMembers.slice(0, 20).forEach((member) => {
        const name = [member.firstName, member.lastName].filter(Boolean).join(' ').trim()
        summary += `- ${name} (${member.username}) - ${member.role}${member.accessLevel === 'WRITE' ? ', Write Access' : ''}\n`
    })
    if (activeMembers.length > 20) {
        summary += `- ... and ${activeMembers.length - 20} more active members\n`
    }

    if (admins.length > 0) {
        summary += `\n**Admin Members:**\n`
        admins.forEach((admin) => {
            const name = [admin.firstName, admin.lastName].filter(Boolean).join(' ').trim()
            summary += `- ${name} (${admin.username})\n`
        })
    }

    return summary
}

/**
 * Generate vendor summary for context
 */
function generateVendorSummary(vendors: BaseInfo['vendor']): string {
    if (!vendors || vendors.length === 0) {
        return 'No vendors found.'
    }

    const activeVendors = vendors.filter((v) => v.active)
    const inactiveVendors = vendors.filter((v) => !v.active)

    let summary = `**Vendors Overview:**\n`
    summary += `- Total vendors: ${vendors.length}\n`
    summary += `- Active vendors: ${activeVendors.length}\n`
    summary += `- Inactive vendors: ${inactiveVendors.length}\n\n`

    if (activeVendors.length > 0) {
        summary += `**Active Vendors:**\n`
        activeVendors.forEach((vendor) => {
            const name = [vendor.firstName, vendor.lastName].filter(Boolean).join(' ').trim()
            const startDate = vendor.startedAt ? new Date(vendor.startedAt).toLocaleDateString() : 'N/A'
            const endDate = vendor.endedAt ? new Date(vendor.endedAt).toLocaleDateString() : 'Ongoing'
            summary += `- ${name} (${vendor.username}) - Started: ${startDate}, Ends: ${endDate}\n`
        })
    }

    return summary
}

/**
 * Generate club configuration summary
 */
function generateClubConfigSummary(config: BaseInfo['clubConfig']): string {
    if (!config) {
        return 'Club configuration not available.'
    }

    let summary = `**Club Configuration:**\n`

    if (config.startedAt) {
        const startDate = new Date(config.startedAt).toLocaleDateString()
        summary += `- Club started: ${startDate}\n`
    }

    if (config.stages && config.stages.length > 0) {
        summary += `\n**Deposit Stages:**\n`
        config.stages.forEach((stage) => {
            const startDate = new Date(stage.startDate).toLocaleDateString()
            const endDate = stage.endDate ? new Date(stage.endDate).toLocaleDateString() : 'Ongoing'
            summary += `- ${stage.name.toUpperCase()}: ₹${stage.amount.toLocaleString()}/month (${startDate} - ${endDate})\n`
        })
    }

    if (config.alpha) {
        summary += `\n**Alpha Stage:**\n`
        summary += `- Amount: ₹${config.alpha.amount.toLocaleString()}/month\n`
        summary += `- Start: ${new Date(config.alpha.startDate).toLocaleDateString()}\n`
        if (config.alpha.endDate) {
            summary += `- End: ${new Date(config.alpha.endDate).toLocaleDateString()}\n`
        }
    }

    if (config.bravo) {
        summary += `\n**Bravo Stage:**\n`
        summary += `- Amount: ₹${config.bravo.amount.toLocaleString()}/month\n`
        summary += `- Start: ${new Date(config.bravo.startDate).toLocaleDateString()}\n`
    }

    if (config.dayInterestFrom) {
        summary += `\n**Interest Settings:**\n`
        summary += `- Daily interest calculation started: ${new Date(config.dayInterestFrom).toLocaleDateString()}\n`
    }

    return summary
}

/**
 * Generate transaction type mappings summary
 */
function generateTransactionTypeSummary(
    typeMap: BaseInfo['transactionTypeMap'],
    humanMap: BaseInfo['transactionTypeHumanMap']
): string {
    if (!typeMap && !humanMap) {
        return ''
    }

    let summary = `**Transaction Types:**\n`

    if (typeMap) {
        Object.entries(typeMap).forEach(([key, value]) => {
            summary += `- ${key}: ${value}\n`
        })
    }

    return summary
}

/**
 * Generate club data summary
 */
function generateClubDataSummary(clubData: BaseInfo['clubData']): string {
    if (!clubData) {
        return ''
    }

    let summary = `**Club Information:**\n`
    if (clubData.sub) {
        summary += `- Club Name: ${clubData.sub}\n`
    }
    if (clubData.avatar) {
        summary += `- Avatar: ${clubData.avatar}\n`
    }

    return summary
}

/**
 * Generate context prompt from base-info.json
 */
export async function generateContextPrompt(): Promise<string> {
    const baseInfo = await loadBaseInfo()

    if (!baseInfo) {
        return ''
    }

    let context = `# Peacock Club Context Information\n\n`
    context += `This context provides base information about the club, members, and configuration. Use this information to answer questions accurately.\n\n`

    // Club data
    const clubDataSummary = generateClubDataSummary(baseInfo.clubData)
    if (clubDataSummary) {
        context += `${clubDataSummary}\n\n`
    }

    // Club configuration
    const clubConfigSummary = generateClubConfigSummary(baseInfo.clubConfig)
    if (clubConfigSummary) {
        context += `${clubConfigSummary}\n\n`
    }

    // Members
    const memberSummary = generateMemberSummary(baseInfo.member)
    if (memberSummary) {
        context += `${memberSummary}\n\n`
    }

    // Vendors
    const vendorSummary = generateVendorSummary(baseInfo.vendor)
    if (vendorSummary) {
        context += `${vendorSummary}\n\n`
    }

    // Transaction types
    const transactionSummary = generateTransactionTypeSummary(
        baseInfo.transactionTypeMap,
        baseInfo.transactionTypeHumanMap
    )
    if (transactionSummary) {
        context += `${transactionSummary}\n\n`
    }

    context += `**Note:** This is base context information. For real-time data, use the available tools (get_member_details, get_loan_accounts, get_transactions, search).`

    return context
}

/**
 * Get a cached context prompt (loads once, reuses)
 */
let cachedContextPrompt: string | null = null
let contextLoadPromise: Promise<string> | null = null

export async function getContextPrompt(): Promise<string> {
    if (cachedContextPrompt) {
        return cachedContextPrompt
    }

    if (contextLoadPromise) {
        return contextLoadPromise
    }

    contextLoadPromise = generateContextPrompt()
    cachedContextPrompt = await contextLoadPromise
    contextLoadPromise = null

    return cachedContextPrompt
}

