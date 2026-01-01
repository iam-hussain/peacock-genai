/**
 * Agent Types
 * Type definitions for agents and agent configuration
 */

import { type ReactAgent } from 'langchain'

export interface AgentConfig {
  name: string
  model: string
  temperature: number
  maxTokens: number
  timeout: number
  apiKey: string
}

export interface AgentInstance {
  name: string
  agent: ReactAgent
  config: AgentConfig
  createdAt: Date
}

export type AgentType =
  | 'club'
  | 'member'
  | 'loan'
  | 'vendor'
  | 'transaction'
  | 'finance'
  | 'default'

export interface AgentFactoryOptions {
  type?: AgentType
  config?: Partial<AgentConfig>
  enableGuardrail?: boolean
}

