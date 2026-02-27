import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from '@langchain/core/prompts'
import type { StructuredToolInterface } from '@langchain/core/tools'
import {
  Annotation,
  END,
  messagesStateReducer,
  START,
  StateGraph,
} from '@langchain/langgraph'
import { ToolNode } from '@langchain/langgraph/prebuilt'
import { ChatOpenAI } from '@langchain/openai'

import { MAIN_SYSTEM_PROMPT } from '@/core/prompts'
import { getAgentConfig } from '@/core/agents/agent-config'

const AgentStateAnnotation = Annotation.Root({
  messages: Annotation({
    reducer: messagesStateReducer,
    default: () => [],
  }),
})

type AgentState = typeof AgentStateAnnotation.State

function createAgentNode(model: ChatOpenAI, tools: StructuredToolInterface[]) {
  const prompt = ChatPromptTemplate.fromMessages([
    [
      'system',
      `Current Date and Time: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}\n\n${MAIN_SYSTEM_PROMPT}`,
    ],
    new MessagesPlaceholder('messages'),
  ])

  const agent = prompt.pipe(model.bindTools(tools))

  return async (state: AgentState): Promise<Partial<AgentState>> => {
    const messages = state.messages
    const response = await agent.invoke({ messages })
    return { messages: [response] }
  }
}

function shouldContinue(state: AgentState): string {
  const lastMessage = state.messages[state.messages.length - 1]

  if (
    lastMessage &&
    'tool_calls' in lastMessage &&
    Array.isArray(lastMessage.tool_calls) &&
    lastMessage.tool_calls.length > 0
  ) {
    return 'tools'
  }

  return 'end'
}

/**
 * Create a LangGraph agent with nodes and edges
 */
export function createAgentGraph(tools: StructuredToolInterface[] = []) {
  const config = getAgentConfig()

  const model = new ChatOpenAI({
    modelName: config.model,
    temperature: config.temperature,
    maxTokens: config.maxTokens,
    openAIApiKey: config.apiKey,
  })

  const agentNode = createAgentNode(model, tools)

  const workflow = new StateGraph(AgentStateAnnotation).addNode(
    'agent',
    agentNode
  )

  if (tools.length > 0) {
    const toolNode = new ToolNode(tools)
    workflow.addNode('tools', toolNode)
  }

  workflow.addEdge(START, 'agent')

  if (tools.length > 0) {
    workflow.addConditionalEdges('agent', shouldContinue, {
      tools: 'tools',
      end: END,
    } as Record<string, string>)
    workflow.addEdge('tools', 'agent')
  } else {
    workflow.addEdge('agent', END)
  }

  return workflow.compile()
}

export function getAgentGraph(tools: StructuredToolInterface[] = []) {
  return createAgentGraph(tools)
}
