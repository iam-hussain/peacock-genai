/**
 * Multi-Agent Graph - Supervisor + Specialist Workflow
 */

import { END, START, StateGraph } from "@langchain/langgraph";

import { createCallToolNode } from "./nodes/call-tool-node";
import { createDirectoryNode } from "./nodes/directory-node";
import { createFinanceNode } from "./nodes/finance-node";
import { createLendingNode } from "./nodes/lending-node";
import { createSupervisorNode } from "./nodes/supervisor-node";
import {
  routeAfterAgent,
  routeAfterCallTool,
  routeFromSupervisor,
} from "./edges";
import { AgentStateAnnotation } from "./state";

export function createSupervisorGraph() {
  const workflow = new StateGraph(AgentStateAnnotation);

  workflow.addNode("supervisor", createSupervisorNode());
  workflow.addNode("directory_agent", createDirectoryNode());
  workflow.addNode("lending_agent", createLendingNode());
  workflow.addNode("finance_agent", createFinanceNode());
  workflow.addNode("call_tool", createCallToolNode());

  workflow.addEdge(START as any, "supervisor" as any);

  workflow.addConditionalEdges("supervisor" as any, routeFromSupervisor, {
    directory_agent: "directory_agent",
    lending_agent: "lending_agent",
    finance_agent: "finance_agent",
    end: END,
  } as any);

  workflow.addConditionalEdges("directory_agent" as any, routeAfterAgent, {
    call_tool: "call_tool",
    supervisor: "supervisor",
  } as any);

  workflow.addConditionalEdges("lending_agent" as any, routeAfterAgent, {
    call_tool: "call_tool",
    supervisor: "supervisor",
  } as any);

  workflow.addConditionalEdges("finance_agent" as any, routeAfterAgent, {
    call_tool: "call_tool",
    supervisor: "supervisor",
  } as any);

  workflow.addConditionalEdges("call_tool" as any, routeAfterCallTool, {
    directory_agent: "directory_agent",
    lending_agent: "lending_agent",
    finance_agent: "finance_agent",
    supervisor: "supervisor",
  } as any);

  return workflow.compile();
}
