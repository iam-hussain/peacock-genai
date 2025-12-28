import { z } from 'zod'

// Environment schema for agent configuration
const agentEnvSchema = z.object({
  OPENAI_API_KEY: z.string().min(1, 'OpenAI API key is required'),
  OPENAI_MODEL: z.string().default('gpt-4o-mini'),
  OPENAI_TEMPERATURE: z
    .string()
    .transform(Number)
    .pipe(z.number().min(0).max(2))
    .default('0.1'),
  AGENT_MAX_TOKENS: z
    .string()
    .transform(Number)
    .pipe(z.number().min(1).max(100000))
    .optional()
    .default('1000'),
  AGENT_TIMEOUT: z
    .string()
    .transform(Number)
    .pipe(z.number().min(1).max(300))
    .optional()
    .default('30'),
})

type AgentEnv = z.infer<typeof agentEnvSchema>

function getAgentEnv(): AgentEnv {
  const parsed = agentEnvSchema.safeParse(process.env)

  if (!parsed.success) {
    console.error('Invalid agent environment variables:', parsed.error.flatten().fieldErrors)
    throw new Error('Invalid agent environment variables')
  }

  return parsed.data
}

export interface AgentConfig {
  apiKey: string
  model: string
  temperature: number
  maxTokens: number
  timeout: number
}

/**
 * Get agent configuration from environment variables
 * 
 * Best practices:
 * - Centralized configuration management
 * - Type-safe environment variable validation with Zod
 * - Clear error messages for missing/invalid config
 * - Sensible defaults for optional values
 * - Single source of truth for agent settings
 */
export function getAgentConfig(): AgentConfig {
  const env = getAgentEnv()

  return {
    apiKey: env.OPENAI_API_KEY,
    model: env.OPENAI_MODEL,
    temperature: env.OPENAI_TEMPERATURE,
    maxTokens: env.AGENT_MAX_TOKENS,
    timeout: env.AGENT_TIMEOUT,
  }
}

