import { Router } from 'express'
import { validate, type ValidatedRequest } from '../../middleware/validator'
import { incomingMessageSchema, type Message } from '../../types'
import { handleAgentChat } from '../handlers/agent.handler'

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
  async (req: ValidatedRequest<Message>, res, next) => {
    await handleAgentChat(req, res, next)
  }
)

