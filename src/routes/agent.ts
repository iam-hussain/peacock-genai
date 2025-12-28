import { Router, type Response } from 'express'
import { HumanMessage } from '@langchain/core/messages'
import { getAgent } from '../agents/setup'
import { validate, type ValidatedRequest } from '../middleware/validator'
import { incomingMessageSchema, type Message } from '../types'

export const agentRouter = Router()

/**
 * POST /api/agent
 * 
 * Chat endpoint for interacting with the LangChain agent
 * Accepts and returns messages in the standardized message structure
 */
agentRouter.post(
  '/',
  validate({
    body: incomingMessageSchema,
  }),
  async (req: ValidatedRequest<Message>, res: Response, next) => {
    try {
      // Get validated message from middleware
      const incomingMessage = req.validatedBody!

      // Process message with agent
      const agent = await getAgent()
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

      // Create response message in the same structure
      const responseMessage: Message = {
        messageId: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'text',
        content: responseContent || '',
        sender: 'assistant',
        receiver: 'user',
        timestamp: new Date().toISOString(),
        status: 'sent',
        error: null,
      }

      res.json(responseMessage)
    } catch (error) {
      next(error)
    }
  }
)

