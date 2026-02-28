/**
 * Finance Agent Node - Audit/Transact
 * execute_transaction, fetch_transactions, get_dashboard_snapshot, get_financial_analytics
 */

import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";
import { ChatOpenAI } from "@langchain/openai";

import type { AgentState } from "../state";

import { FINANCE_AGENT_PROMPT } from "@/ai/agents/prompts";
import { getAgentConfig } from "@/core/agents/agent-config";
import { createAnalyticsTools, createLedgerTools } from "@/core/tools";

export function createFinanceNode() {
  const config = getAgentConfig();
  const model = new ChatOpenAI({
    modelName: config.model,
    temperature: config.temperature,
    maxTokens: config.maxTokens,
    openAIApiKey: config.apiKey,
  });

  const tools = [...createLedgerTools(), ...createAnalyticsTools()];
  const prompt = ChatPromptTemplate.fromMessages([
    ["system", FINANCE_AGENT_PROMPT],
    new MessagesPlaceholder("messages"),
  ]);

  const chain = prompt.pipe(model.bindTools(tools));

  return async (state: AgentState): Promise<Partial<AgentState>> => {
    const response = await chain.invoke({ messages: state.messages });
    const hasToolCalls =
      "tool_calls" in response &&
      Array.isArray(response.tool_calls) &&
      response.tool_calls.length > 0;
    return {
      messages: [response],
      ...(hasToolCalls && { currentAgent: "finance_agent" }),
    };
  };
}
