/**
 * Message Types
 * Type definitions for chat messages and message content
 */

import { z } from 'zod'

export type MessageType =
  | 'text'
  | 'image'
  | 'file'
  | 'audio'
  | 'table'
  | 'form'
  | 'list'
  | 'card'

export type MessageSender = 'user' | 'assistant' | 'system'

export type MessageStatus = 'sent' | 'delivered' | 'read' | 'error' | 'pending'

export interface TokenUsage {
  promptTokens?: number
  completionTokens?: number
  totalTokens?: number
}

/**
 * Table data structure for table messages
 */
export interface TableData {
  headers: string[]
  rows: (string | number)[][]
  caption?: string
}

/**
 * List data structure for list messages
 */
export interface ListData {
  items: string[]
  ordered?: boolean
  title?: string
}

/**
 * Form data structure for form messages
 */
export interface FormData {
  fields: Array<{
    name: string
    label: string
    type: 'text' | 'number' | 'email' | 'date' | 'select'
    value?: string | number
    options?: string[]
    required?: boolean
  }>
  submitLabel?: string
  title?: string
}

/**
 * Card data structure for card messages
 */
export interface CardData {
  title: string
  description?: string
  items?: Array<{
    label: string
    value: string | number
  }>
  footer?: string
}

/**
 * Message content can be a string or structured data
 */
export type MessageContent =
  | string
  | TableData
  | ListData
  | FormData
  | CardData

export interface Message {
  messageId: string
  type: MessageType
  content: MessageContent
  sender: MessageSender
  receiver: MessageSender
  timestamp: string
  status: MessageStatus
  error: string | null
  tokenUsage?: TokenUsage
}

/**
 * Zod schema for Message validation
 * Used for validating incoming messages in API endpoints
 */
const tableDataSchema = z.object({
  headers: z.array(z.string()),
  rows: z.array(z.array(z.union([z.string(), z.number()]))),
  caption: z.string().optional(),
})

const listDataSchema = z.object({
  items: z.array(z.string()),
  ordered: z.boolean().optional(),
  title: z.string().optional(),
})

const formFieldSchema = z.object({
  name: z.string(),
  label: z.string(),
  type: z.enum(['text', 'number', 'email', 'date', 'select']),
  value: z.union([z.string(), z.number()]).optional(),
  options: z.array(z.string()).optional(),
  required: z.boolean().optional(),
})

const formDataSchema = z.object({
  fields: z.array(formFieldSchema),
  submitLabel: z.string().optional(),
  title: z.string().optional(),
})

const cardDataSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  items: z
    .array(
      z.object({
        label: z.string(),
        value: z.union([z.string(), z.number()]),
      })
    )
    .optional(),
  footer: z.string().optional(),
})

export const messageSchema = z.object({
  messageId: z
    .string()
    .min(1, 'messageId is required and must be a non-empty string'),
  type: z.enum(
    ['text', 'image', 'file', 'audio', 'table', 'form', 'list', 'card'],
    {
      errorMap: () => ({
        message:
          'type must be one of: text, image, file, audio, table, form, list, card',
      }),
    }
  ),
  content: z.union([
    z.string(),
    tableDataSchema,
    listDataSchema,
    formDataSchema,
    cardDataSchema,
  ]),
  sender: z.enum(['user', 'assistant', 'system'], {
    errorMap: () => ({
      message: 'sender must be one of: user, assistant, system',
    }),
  }),
  receiver: z.enum(['user', 'assistant', 'system'], {
    errorMap: () => ({
      message: 'receiver must be one of: user, assistant, system',
    }),
  }),
  timestamp: z
    .string()
    .datetime('timestamp must be a valid ISO 8601 datetime string'),
  status: z.enum(['sent', 'delivered', 'read', 'error', 'pending'], {
    errorMap: () => ({
      message: 'status must be one of: sent, delivered, read, error, pending',
    }),
  }),
  error: z.string().nullable(),
})

/**
 * Schema for incoming user messages (more restrictive)
 * Only accepts text messages from users
 */
export const incomingMessageSchema = messageSchema
  .extend({
    type: z.literal('text', {
      errorMap: () => ({
        message: 'Only text messages are currently supported',
      }),
    }),
    sender: z.literal('user', {
      errorMap: () => ({ message: 'Only messages from user are accepted' }),
    }),
  })
  .strict()

