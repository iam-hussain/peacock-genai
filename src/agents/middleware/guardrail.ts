/**
 * LangChain Agent Guardrail Middleware
 * Intercepts agent invocations to filter out non-club related questions
 */

import { type BaseMessage } from '@langchain/core/messages'
import { type ReactAgent } from 'langchain'
import { AIMessage } from '@langchain/core/messages'

const ALLOWED_KEYWORDS = [
    // Club related
    'club', 'peacock', 'stage', 'alpha', 'bravo', 'deposit', 'withdrawal',
    // Member related
    'member', 'members', 'account', 'accounts', 'username', 'balance', 'balances',
    // Loan related
    'loan', 'loans', 'repay', 'repayment', 'interest', 'outstanding',
    // Vendor related
    'vendor', 'vendors', 'investment', 'investments', 'return', 'returns',
    // Transaction related
    'transaction', 'transactions', 'history', 'transfer', 'funds',
    // Passbook related
    'passbook', 'passbooks', 'summary', 'summaries', 'statistic', 'statistics',
    // Financial terms
    'financial', 'finance', 'money', 'amount', 'rupee', 'rupees', 'inr', '₹',
]

const BLOCKED_PATTERNS = [
    // Greetings
    /^(hi|hello|hey|greetings|good\s+(morning|afternoon|evening|day)|how\s+are\s+you|what's\s+up|sup)\s*[!?.]*$/i,
    // General questions
    /^(what|who|where|when|why|how)\s+(is|are|was|were|do|does|did|can|could|will|would)\s+(the\s+)?(weather|time|date|news|today|happening)/i,
    /^(tell\s+me|explain|describe|what\s+is)\s+(a|an|the)?\s*(joke|story|joke|funny|entertainment)/i,
    /^(help\s+me|can\s+you\s+help|assist\s+me)\s+(with|in)?\s*(coding|programming|development|tech|technology|software)/i,
    /^(calculate|compute|solve|what\s+is)\s+(\d+\s*[+\-*/]\s*\d+|[0-9]+\s*[+\-*/]\s*[0-9]+)/i,
]

/**
 * Check if a message is related to Peacock Club operations
 */
function isClubRelated(message: string): boolean {
    const normalizedMessage = message.toLowerCase().trim()

    // Check for blocked patterns first
    for (const pattern of BLOCKED_PATTERNS) {
        if (pattern.test(normalizedMessage)) {
            return false
        }
    }

    // Check if message contains allowed keywords
    const hasAllowedKeyword = ALLOWED_KEYWORDS.some(keyword =>
        normalizedMessage.includes(keyword.toLowerCase())
    )

    // If message is very short and doesn't have allowed keywords, likely a greeting
    if (normalizedMessage.length < 10 && !hasAllowedKeyword) {
        return false
    }

    return hasAllowedKeyword
}

/**
 * Get rejection message for off-topic questions
 */
function getRejectionMessage(): string {
    return 'I can only assist with questions about Peacock Club operations. Please ask about club information, members, loans, vendors, or transactions.'
}

/**
 * Extract text content from LangChain messages
 */
function extractMessageContent(messages: BaseMessage[]): string {
    if (messages.length === 0) {
        return ''
    }

    const lastMessage = messages[messages.length - 1]
    if (!lastMessage) {
        return ''
    }

    if (typeof lastMessage.content === 'string') {
        return lastMessage.content
    }

    if (Array.isArray(lastMessage.content)) {
        return lastMessage.content
            .map((c: any) => (typeof c === 'string' ? c : c.text || c.content || ''))
            .join(' ')
    }

    return String(lastMessage.content || '')
}

/**
 * Create a guardrail-wrapped agent
 * This middleware intercepts agent invocations and blocks non-club related questions
 */
export function withGuardrail(agent: ReactAgent): ReactAgent {
    // Create a proxy that intercepts the invoke method
    const guardedAgent = new Proxy(agent, {
        get(target, prop) {
            if (prop === 'invoke') {
                return async (input: { messages: BaseMessage[] } | any) => {
                    // Extract message content from input
                    const messages = input.messages || (Array.isArray(input) ? input : [])
                    const messageContent = extractMessageContent(messages)

                    // Check if message is club-related
                    if (!isClubRelated(messageContent)) {
                        // Return rejection message without calling the agent
                        return {
                            messages: [
                                ...messages,
                                new AIMessage({
                                    content: getRejectionMessage(),
                                }),
                            ],
                        }
                    }

                    // Message passed guardrail, proceed with agent invocation
                    return target.invoke(input)
                }
            }

            // Forward all other properties/methods to the original agent
            const value = (target as any)[prop]
            return typeof value === 'function' ? value.bind(target) : value
        },
    })

    return guardedAgent as ReactAgent
}

