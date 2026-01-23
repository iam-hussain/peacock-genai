import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";
import {
  Annotation,
  END,
  messagesStateReducer,
  START,
  StateGraph,
} from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { ChatOpenAI } from "@langchain/openai";

import { MAIN_SYSTEM_PROMPT } from "./prompts";

import { getAgentConfig } from "@/config/agent";

/**
 * Agent State Annotation
 * Defines the state structure for the LangGraph agent using Annotation API
 */
const AgentStateAnnotation = Annotation.Root({
  messages: Annotation({
    reducer: messagesStateReducer,
    default: () => [],
  }),
});

type AgentState = typeof AgentStateAnnotation.State;

/**
 * System prompt for the agent
 */
const SYSTEM_PROMPT = MAIN_SYSTEM_PROMPT;

/**
 * Create the agent node
 * This node uses the LLM to process messages and decide on actions
 */
function createAgentNode(model: ChatOpenAI, tools: any[]) {
  const prompt = ChatPromptTemplate.fromMessages([
    [
      "system",
      `Current Date and Time: ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}\n\n${SYSTEM_PROMPT}`,
    ],
    new MessagesPlaceholder("messages"),
  ]);

  const agent = prompt.pipe(model.bindTools(tools));

  return async (state: AgentState): Promise<Partial<AgentState>> => {
    const messages = state.messages;
    const response = await agent.invoke({ messages });
    return { messages: [response] };
  };
}

/**
 * Determine the next step in the graph
 * Routes to tools if tool calls are present, otherwise ends
 */
function shouldContinue(state: AgentState): string {
  const lastMessage = state.messages[state.messages.length - 1];

  // Check if the last message has tool calls
  if (
    lastMessage &&
    "tool_calls" in lastMessage &&
    Array.isArray(lastMessage.tool_calls) &&
    lastMessage.tool_calls.length > 0
  ) {
    return "tools";
  }

  return "end";
}

/**
 * Create a LangGraph agent with nodes and edges
 *
 * Graph structure:
 * START -> agent -> shouldContinue -> tools (if needed) -> agent (loop) -> END
 *                                    -> end (if no tools)
 */
export function createAgentGraph(tools: any[] = []) {
  const config = getAgentConfig();

  // Initialize the OpenAI model
  const model = new ChatOpenAI({
    modelName: config.model,
    temperature: config.temperature,
    maxTokens: config.maxTokens,
    openAIApiKey: config.apiKey,
  });

  // Create nodes
  const agentNode = createAgentNode(model, tools);

  // Create the graph with state annotation
  const workflow = new StateGraph(AgentStateAnnotation).addNode(
    "agent",
    agentNode
  );

  // Add tools node if tools are provided
  if (tools.length > 0) {
    const toolNode = new ToolNode(tools);
    workflow.addNode("tools", toolNode);
  }

  // Add entry edge
  workflow.addEdge(START, "agent");

  // Add conditional edges based on whether tools exist
  if (tools.length > 0) {
    // Conditional edge: check if tools are needed
    // Type assertion needed because TypeScript can't infer conditional node types
    workflow.addConditionalEdges("agent", shouldContinue, {
      tools: "tools",
      end: END,
    } as any);

    // After tools, loop back to agent
    workflow.addEdge("tools" as any, "agent");
  } else {
    // No tools, go directly to end
    workflow.addEdge("agent", END);
  }

  // Compile the graph
  return workflow.compile();
}

/**
 * Create and return a default agent graph instance
 * This can be extended with custom tools
 */
export function getAgentGraph(tools: any[] = []) {
  return createAgentGraph(tools);
}
