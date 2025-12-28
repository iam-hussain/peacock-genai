// Shared types and interfaces

import { z } from 'zod'

export interface ApiResponse<T = unknown> {
    data?: T
    error?: string
    message?: string
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
    pagination?: {
        page: number
        limit: number
        total: number
        totalPages: number
    }
}

export type MessageType = 'text' | 'image' | 'file' | 'audio'
export type MessageSender = 'user' | 'assistant' | 'system'
export type MessageStatus = 'sent' | 'delivered' | 'read' | 'error' | 'pending'

export interface TokenUsage {
    promptTokens?: number
    completionTokens?: number
    totalTokens?: number
}

export interface Message {
    messageId: string
    type: MessageType
    content: string
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
export const messageSchema = z.object({
    messageId: z.string().min(1, 'messageId is required and must be a non-empty string'),
    type: z.enum(['text', 'image', 'file', 'audio'], {
        errorMap: () => ({ message: 'type must be one of: text, image, file, audio' }),
    }),
    content: z.string().min(1, 'content is required and must be a non-empty string'),
    sender: z.enum(['user', 'assistant', 'system'], {
        errorMap: () => ({ message: 'sender must be one of: user, assistant, system' }),
    }),
    receiver: z.enum(['user', 'assistant', 'system'], {
        errorMap: () => ({ message: 'receiver must be one of: user, assistant, system' }),
    }),
    timestamp: z.string().datetime('timestamp must be a valid ISO 8601 datetime string'),
    status: z.enum(['sent', 'delivered', 'read', 'error', 'pending'], {
        errorMap: () => ({ message: 'status must be one of: sent, delivered, read, error, pending' }),
    }),
    error: z.string().nullable(),
})

/**
 * Schema for incoming user messages (more restrictive)
 * Only accepts text messages from users
 */
export const incomingMessageSchema = messageSchema.extend({
    type: z.literal('text', {
        errorMap: () => ({ message: 'Only text messages are currently supported' }),
    }),
    sender: z.literal('user', {
        errorMap: () => ({ message: 'Only messages from user are accepted' }),
    }),
}).strict()

