/**
 * Application Constants
 * Centralized constants to avoid magic strings and numbers
 */

export const MESSAGE_STATUS = {
  SENT: "sent",
  DELIVERED: "delivered",
  READ: "read",
  ERROR: "error",
  PENDING: "pending",
} as const;

export const MESSAGE_TYPE = {
  TEXT: "text",
  IMAGE: "image",
  FILE: "file",
  AUDIO: "audio",
  TABLE: "table",
  FORM: "form",
  LIST: "list",
  CARD: "card",
} as const;

export const MESSAGE_SENDER = {
  USER: "user",
  ASSISTANT: "assistant",
  SYSTEM: "system",
} as const;

/**
 * Generate a unique message ID
 */
export function generateMessageId(): string {
  return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Maximum message content length (characters)
 */
export const MAX_MESSAGE_LENGTH = 10000;

/**
 * Request timeout for agent invocations (milliseconds)
 */
export const AGENT_REQUEST_TIMEOUT = 60000; // 60 seconds
