import { type Response } from 'express'
import { HumanMessage } from '@langchain/core/messages'
import { agentManager } from '../../agents'
import { createError } from '../../middleware/error-handler'
import { type ValidatedRequest } from '../../middleware/validator'
import { type Message, type TokenUsage } from '../../types'
import { logger } from '../../utils/logger'
import { MESSAGE_STATUS, MESSAGE_TYPE, MESSAGE_SENDER, generateMessageId } from '../../constants'
import { detectErrorType } from './error-detection'

/**
 * LangChain result metadata structure
 */
interface LangChainMetadata {
  usage?: {
    prompt_tokens?: number
    completion_tokens?: number
    total_tokens?: number
    promptTokens?: number
    completionTokens?: number
    totalTokens?: number
  }
  token_usage?: {
    prompt_tokens?: number
    completion_tokens?: number
    total_tokens?: number
    promptTokens?: number
    completionTokens?: number
    totalTokens?: number
  }
}

interface LangChainMessage {
  response_metadata?: LangChainMetadata
  metadata?: LangChainMetadata
}

interface LangChainResult {
  response_metadata?: LangChainMetadata
  metadata?: LangChainMetadata
  messages?: LangChainMessage[]
}

/**
 * Extracts token usage information from agent result
 * LangChain v1.x stores token usage in different places depending on the provider
 */
export function extractTokenUsage(result: LangChainResult): TokenUsage | undefined {
  try {
    // Check for usage in response_metadata or nested in messages
    const metadata = result.response_metadata || result.metadata || {}
    const usage = metadata.usage || metadata.token_usage || {}

    // Also check in the last message's response_metadata
    const lastMessage = result.messages?.[result.messages.length - 1]
    const messageMetadata = lastMessage?.response_metadata || lastMessage?.metadata || {}
    const messageUsage = messageMetadata.usage || messageMetadata.token_usage || {}

    // Combine both sources
    const promptTokens = usage.prompt_tokens || usage.promptTokens || messageUsage.prompt_tokens || messageUsage.promptTokens
    const completionTokens = usage.completion_tokens || usage.completionTokens || messageUsage.completion_tokens || messageUsage.completionTokens
    const totalTokens = usage.total_tokens || usage.totalTokens || messageUsage.total_tokens || messageUsage.totalTokens

    if (promptTokens || completionTokens || totalTokens) {
      return {
        promptTokens: promptTokens ? Number(promptTokens) : undefined,
        completionTokens: completionTokens ? Number(completionTokens) : undefined,
        totalTokens: totalTokens ? Number(totalTokens) : undefined,
      }
    }

    return undefined
  } catch (error) {
    console.warn('Failed to extract token usage:', error)
    return undefined
  }
}

/**
 * Handle agent chat request
 */
export async function handleAgentChat(
  req: ValidatedRequest<Message>,
  res: Response,
  next: (error?: any) => void
): Promise<void> {
  try {
    // Get validated message from middleware
    const incomingMessage = req.validatedBody!

    // Process message with agent (guardrail is built into the agent)
    const agent = await agentManager.getAgent()
    const result = await agent.invoke({
      messages: [new HumanMessage(incomingMessage.content.trim())],
    })

    // Extract the last message content from the result
    const lastMessage = result.messages[result.messages.length - 1]
    const responseContent =
      typeof lastMessage?.content === 'string'
        ? lastMessage.content
        : Array.isArray(lastMessage?.content)
          ? lastMessage.content.map((c: any) => c.text || c).join('')
          : ''

    // Extract token usage from result metadata
    const tokenUsage = extractTokenUsage(result)

    // Log token usage
    if (tokenUsage) {
      logger.info('Token Usage', {
        promptTokens: tokenUsage.promptTokens || 0,
        completionTokens: tokenUsage.completionTokens || 0,
        totalTokens: tokenUsage.totalTokens || 0,
      })
    }

    // Create response message in the same structure
    const responseMessage: Message = {
      messageId: generateMessageId(),
      type: MESSAGE_TYPE.TEXT,
      content: responseContent || '',
      sender: MESSAGE_SENDER.ASSISTANT,
      receiver: MESSAGE_SENDER.USER,
      timestamp: new Date().toISOString(),
      status: MESSAGE_STATUS.SENT,
      error: null,
      tokenUsage,
    }

    res.json(responseMessage)
  } catch (error: any) {
    // Log the original error for debugging
    logger.error('Agent chat error:', error)

    // Detect error type
    const errorInfo = detectErrorType(error)

    // Handle specific error types with user-friendly messages
    if (errorInfo.isApiKeyError) {
      return next(createError('Invalid API key. Please check your OpenAI API key configuration in the .env file.', 401))
    }

    if (errorInfo.isRateLimitError) {
      return next(createError('Rate limit exceeded. Please try again in a few moments.', 429))
    }

    if (errorInfo.isQuotaError) {
      return next(createError('Insufficient quota or billing issue. Please check your OpenAI account.', 402))
    }

    // Pass other errors to the error handler (which will sanitize them)
    next(error)
  }
}

