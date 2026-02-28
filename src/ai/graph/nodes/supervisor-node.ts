/**
 * Supervisor Node - The Router
 * Decides which agent to call next
 */

import { HumanMessage } from "@langchain/core/messages";
import { ChatOpenAI } from "@langchain/openai";

import type { AgentState } from "../state";

import { SUPERVISOR_PROMPT } from "@/ai/agents/prompts";
import { getAgentConfig } from "@/core/agents/agent-config";

export function createSupervisorNode() {
  const config = getAgentConfig();
  const model = new ChatOpenAI({
    modelName: config.model,
    temperature: 0,
    maxTokens: 100,
    openAIApiKey: config.apiKey,
  });

  return async (state: AgentState): Promise<Partial<AgentState>> => {
    const messages = state.messages;
    const lastMessage = messages[messages.length - 1];

    const lastIsAiResponse =
      lastMessage &&
      lastMessage._getType() === "ai" &&
      (!("tool_calls" in lastMessage) ||
        !Array.isArray(lastMessage.tool_calls) ||
        lastMessage.tool_calls.length === 0);

    if (lastIsAiResponse) {
      return { next: "__end__" };
    }

    const lastUserMessage = [...messages]
      .reverse()
      .find((m) => m._getType() === "human") as HumanMessage | undefined;

    const prompt = SUPERVISOR_PROMPT;
    const content =
      lastUserMessage?.content?.toString() ||
      (typeof lastUserMessage?.content === "string"
        ? lastUserMessage.content
        : "");

    if (!content?.trim()) {
      return { next: "__end__" };
    }

    const auth = state.auth;
    const accessLevel = auth?.accessLevel ?? "READ";

    const authContext = `Auth: ${accessLevel}`;
    const systemPlusUser = `${prompt}\n\n${authContext}\n\nUser request: ${content}`;
    const response = await model.invoke([
      { role: "system", content: systemPlusUser },
      {
        role: "user",
        content: "Which agent should handle this? Reply with one word.",
      },
    ]);

    const text = (response.content as string)?.toUpperCase().trim() || "";
    let next = "supervisor";

    if (text.includes("FINISH") || text.includes("__END__")) {
      next = "__end__";
    } else if (text.includes("DIRECTORY")) {
      next = "directory_agent";
    } else if (text.includes("LENDING")) {
      next = "lending_agent";
    } else if (text.includes("FINANCE")) {
      next = "finance_agent";
    } else {
      next = "__end__";
    }

    return { next };
  };
}
