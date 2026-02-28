/**
 * Agent State for multi-agent graph
 */

import { Annotation, messagesStateReducer } from "@langchain/langgraph";

export type AccessLevel = "READ" | "WRITE" | "ADMIN";

export interface AuthContext {
  accessLevel: AccessLevel;
  userId?: string | null;
}

export const AgentStateAnnotation = Annotation.Root({
  messages: Annotation({
    reducer: messagesStateReducer,
    default: () => [],
  }),
  next: Annotation<string>(),
  currentAgent: Annotation<string>(),
  auth: Annotation<AuthContext>(),
  error: Annotation<string | null>(),
});

export type AgentState = typeof AgentStateAnnotation.State;
