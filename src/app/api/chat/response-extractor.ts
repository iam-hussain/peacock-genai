/**
 * Extracts token usage and response content from LangChain agent results
 */

import type { Message } from "@/types";

interface LangChainMetadata {
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
  token_usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
}

interface LangChainMessage {
  content?: string | unknown[];
  response_metadata?: LangChainMetadata;
  metadata?: LangChainMetadata;
  name?: string;
}

export interface LangChainResult {
  response_metadata?: LangChainMetadata;
  metadata?: LangChainMetadata;
  messages?: LangChainMessage[];
}

export function extractTokenUsage(
  result: LangChainResult
): Message["tokenUsage"] | undefined {
  try {
    const metadata = result.response_metadata || result.metadata || {};
    const usage = metadata.usage || metadata.token_usage || {};

    const lastMessage = result.messages?.[result.messages.length - 1];
    const messageMetadata =
      lastMessage?.response_metadata || lastMessage?.metadata || {};
    const messageUsage =
      messageMetadata.usage || messageMetadata.token_usage || {};

    const promptTokens =
      usage.prompt_tokens ||
      usage.promptTokens ||
      messageUsage.prompt_tokens ||
      messageUsage.promptTokens;
    const completionTokens =
      usage.completion_tokens ||
      usage.completionTokens ||
      messageUsage.completion_tokens ||
      messageUsage.completionTokens;
    const totalTokens =
      usage.total_tokens ||
      usage.totalTokens ||
      messageUsage.total_tokens ||
      messageUsage.totalTokens;

    if (promptTokens || completionTokens || totalTokens) {
      return {
        promptTokens: promptTokens ? Number(promptTokens) : undefined,
        completionTokens: completionTokens
          ? Number(completionTokens)
          : undefined,
        totalTokens: totalTokens ? Number(totalTokens) : undefined,
      };
    }

    return undefined;
  } catch {
    return undefined;
  }
}

export function extractResponseContent(result: LangChainResult): string {
  const lastMessage = result.messages?.[result.messages.length - 1];

  let toolResultContent: string | null = null;

  for (const msg of result.messages ?? []) {
    if (!msg) continue;

    let msgContent = "";
    if (typeof msg.content === "string") {
      msgContent = msg.content;
    } else if (Array.isArray(msg.content)) {
      msgContent = msg.content
        .map((c: unknown) => {
          if (typeof c === "string") return c;
          if (c && typeof c === "object" && "text" in c) {
            return (c as { text: string }).text;
          }
          return String(c);
        })
        .join("\n");
    } else if (msg.content) {
      msgContent = String(msg.content);
    }

    if (msgContent) {
      const isMemberList = /^[-*]\s+.+?\s-\s(Active|Inactive)/m.test(
        msgContent
      );
      if (isMemberList && !toolResultContent) {
        toolResultContent = msgContent;
      }
      if (
        "name" in msg &&
        typeof (msg as { name?: unknown }).name === "string" &&
        (msg as { name: string }).name === "get_members_list"
      ) {
        toolResultContent = msgContent;
      }
    }
  }

  const aiContent =
    typeof lastMessage?.content === "string"
      ? lastMessage.content
      : Array.isArray(lastMessage?.content)
        ? lastMessage.content
            .map((c: unknown) => {
              if (typeof c === "string") return c;
              if (c && typeof c === "object" && "text" in c) {
                return (c as { text: string }).text;
              }
              return String(c);
            })
            .join("")
        : "";

  if (
    toolResultContent &&
    /^[-*]\s+.+?\s-\s(Active|Inactive)/m.test(toolResultContent)
  ) {
    const aiHasList = /^[-*]\s+.+?\s-\s(Active|Inactive)/m.test(aiContent);
    if (!aiHasList) {
      return toolResultContent;
    }
    return aiContent;
  }

  if (toolResultContent) {
    return `${aiContent}\n\n${toolResultContent}`;
  }

  return aiContent;
}
