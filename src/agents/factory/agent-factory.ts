/**
 * Agent Factory
 * Creates LangChain agents with configuration
 */

import { ChatOpenAI } from "@langchain/openai";
import { createAgent, type ReactAgent } from "langchain";

import { getAgentConfig } from "../../config/agent";
import { getSystemPrompt } from "../prompts/club-agent.prompt";
import { agentTools } from "../tools";

/**
 * Create a React agent instance
 */
export async function createAgentInstance(): Promise<ReactAgent> {
  const config = getAgentConfig();

  // Validate required config
  if (!config.model || !config.apiKey) {
    throw new Error("Model and API key are required");
  }

  // Create chat model
  const chatModel = new ChatOpenAI({
    modelName: config.model,
    temperature: config.temperature,
    maxTokens: config.maxTokens,
    timeout: config.timeout * 1000,
    openAIApiKey: config.apiKey,
  });

  // Get system prompt with context
  const systemPrompt = await getSystemPrompt("club");

  // Create agent with tools
  // Using type assertion to bypass LangChain's excessively deep type inference
  // This prevents TypeScript from consuming excessive memory during type checking
  const agent = createAgent({
    model: chatModel,
    prompt: systemPrompt,
    tools: agentTools,
  }) as ReactAgent;

  return agent;
}
