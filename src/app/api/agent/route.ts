import { HumanMessage } from "@langchain/core/messages";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { agentManager } from "@/agents";
import { initializeFinanceMemory } from "@/agents/memory";
import { generateMessageId, MESSAGE_SENDER, MESSAGE_STATUS } from "@/constants";
import { measureTime } from "@/lib/performance";
import {
  checkRateLimit,
  getClientIdentifier,
  type RateLimitConfig,
} from "@/lib/rate-limit";
import { getRequestIdFromHeaders } from "@/lib/request-id";
import { incomingMessageSchema, type Message } from "@/types";
import { formatApiError, isPeacockApiError } from "@/utils/api-error";
import { detectErrorType } from "@/utils/error-detection";
import { logger } from "@/utils/logger";

// Rate limit configuration
const RATE_LIMIT_CONFIG: RateLimitConfig = {
  maxRequests: 30, // 30 requests
  windowMs: 60 * 1000, // per minute
};

/**
 * LangChain result metadata structure
 */
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
  response_metadata?: LangChainMetadata;
  metadata?: LangChainMetadata;
}

interface LangChainResult {
  response_metadata?: LangChainMetadata;
  metadata?: LangChainMetadata;
  messages?: LangChainMessage[];
}

/**
 * Extracts token usage information from agent result
 */
function extractTokenUsage(
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
  } catch (error) {
    console.warn("Failed to extract token usage:", error);
    return undefined;
  }
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

/**
 * POST /api/agent
 * Chat endpoint for interacting with the LangChain agent
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const requestId = getRequestIdFromHeaders(req.headers);

  try {
    // Ensure memory is initialized before handling requests
    await initializeFinanceMemory();

    // Rate limiting
    const clientId = getClientIdentifier(req);
    const rateLimit = checkRateLimit(clientId, RATE_LIMIT_CONFIG);

    if (!rateLimit.allowed) {
      logger.warn("Rate limit exceeded", { clientId }, requestId);
      return NextResponse.json(
        {
          error: "Rate limit exceeded. Please try again later.",
          retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000),
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": String(RATE_LIMIT_CONFIG.maxRequests),
            "X-RateLimit-Remaining": String(rateLimit.remaining),
            "X-RateLimit-Reset": String(rateLimit.resetTime),
            "Retry-After": String(
              Math.ceil((rateLimit.resetTime - Date.now()) / 1000)
            ),
            "X-Request-ID": requestId,
          },
        }
      );
    }

    const body = await req.json();

    // Validate request body
    const validationResult = incomingMessageSchema.safeParse(body);
    if (!validationResult.success) {
      const fieldErrors = validationResult.error.flatten().fieldErrors;
      const errorMessages = Object.entries(fieldErrors)
        .map(([field, messages]) => `${field}: ${messages?.join(", ")}`)
        .join("; ");

      return NextResponse.json(
        { error: `Validation failed: ${errorMessages}` },
        {
          status: 400,
          headers: {
            "X-Request-ID": requestId,
          },
        }
      );
    }

    const incomingMessage = validationResult.data;
    logger.info("Processing agent request", {
      requestId,
      messageId: incomingMessage.messageId,
    });

    // Process message with agent (with performance measurement)
    const agent = await agentManager.getAgent();
    const messageContent =
      typeof incomingMessage.content === "string"
        ? incomingMessage.content.trim()
        : String(incomingMessage.content);

    const { result, duration } = await measureTime(
      async () =>
        agent.invoke({
          messages: [new HumanMessage(messageContent)],
        }),
      `Agent invocation [${requestId}]`
    );

    logger.info("Agent response received", {
      requestId,
      duration: `${duration.toFixed(2)}ms`,
    });

    // Extract response content from messages
    // Look through ALL messages to find tool results and AI responses
    const lastMessage = result.messages[result.messages.length - 1];
    
    // Search all messages for tool results (especially get_members_list)
    let toolResultContent: string | null = null;
    let allMessageContent: string[] = [];
    
    for (const msg of result.messages) {
      if (!msg) continue;
      
      // Extract content from any message
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
        allMessageContent.push(msgContent);
        
        // Check if this looks like a tool result (member list format)
        const isMemberList = /^[-*]\s+.+?\s-\s(Active|Inactive)/m.test(msgContent);
        if (isMemberList && !toolResultContent) {
          toolResultContent = msgContent;
        }
        
        // Also check for ToolMessage by name property
        if (
          "name" in msg &&
          typeof (msg as { name?: unknown }).name === "string" &&
          (msg as { name: string }).name === "get_members_list"
        ) {
          toolResultContent = msgContent;
        }
      }
    }

    // Extract AI's final response
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

    // Determine final response content
    let responseContent: string;
    
    // If we found a tool result with member list pattern, use it
    if (toolResultContent && /^[-*]\s+.+?\s-\s(Active|Inactive)/m.test(toolResultContent)) {
      // Check if AI response is just explanatory text without the list
      const aiHasList = /^[-*]\s+.+?\s-\s(Active|Inactive)/m.test(aiContent);
      if (!aiHasList) {
        // AI only provided explanation, tool has the actual list - use tool result
        responseContent = toolResultContent;
      } else {
        // Both have lists, prefer AI response (it might be filtered/formatted)
        responseContent = aiContent;
      }
    } else if (toolResultContent) {
      // Tool result exists but not a member list - combine with AI response
      responseContent = `${aiContent}\n\n${toolResultContent}`;
    } else {
      // No tool result found, use AI response
      responseContent = aiContent;
    }

    // Extract token usage from result metadata
    const tokenUsage = extractTokenUsage(result);

    // Log token usage
    if (tokenUsage) {
      const usage = {
        promptTokens: tokenUsage.promptTokens || 0,
        completionTokens: tokenUsage.completionTokens || 0,
        totalTokens: tokenUsage.totalTokens || 0,
      };
      logger.info("Token usage", usage, requestId);
    }

    // Parse response content to determine UI component type
    const { parseMessageContent } = await import("@/utils/message-parser");
    const parsed = parseMessageContent(responseContent || "");

    // Create response message with appropriate type and structured content
    const responseMessage: Message = {
      messageId: generateMessageId(),
      type: parsed.type as Message["type"],
      content: parsed.data,
      sender: MESSAGE_SENDER.ASSISTANT,
      receiver: MESSAGE_SENDER.USER,
      timestamp: new Date().toISOString(),
      status: MESSAGE_STATUS.SENT,
      error: null,
      tokenUsage,
    };

    return NextResponse.json(responseMessage, {
      headers: {
        "X-Request-ID": requestId,
      },
    });
  } catch (error: unknown) {
    logger.error("Agent chat error", error, requestId);

    // Check if it's a Peacock API error
    if (isPeacockApiError(error)) {
      const apiErrorInfo = formatApiError(error, "agent-tool");
      return NextResponse.json(
        {
          error: apiErrorInfo.message,
          apiError: true,
          endpoint: apiErrorInfo.endpoint,
        },
        {
          status: 500,
          headers: {
            "X-Request-ID": requestId,
          },
        }
      );
    }

    // Detect error type
    const errorInfo = detectErrorType(error);

    // Handle specific error types
    if (errorInfo.isApiKeyError) {
      return NextResponse.json(
        {
          error:
            "Invalid API key. Please check your OpenAI API key configuration in the .env file.",
        },
        {
          status: 401,
          headers: {
            "X-Request-ID": requestId,
          },
        }
      );
    }

    if (errorInfo.isRateLimitError) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please try again in a few moments." },
        {
          status: 429,
          headers: {
            "X-Request-ID": requestId,
          },
        }
      );
    }

    if (errorInfo.isQuotaError) {
      return NextResponse.json(
        {
          error:
            "Insufficient quota or billing issue. Please check your OpenAI account.",
        },
        {
          status: 402,
          headers: {
            "X-Request-ID": requestId,
          },
        }
      );
    }

    // Generic error response
    const errorMessage =
      error instanceof Error
        ? error.message
        : "An error occurred while processing your request";
    const sanitizedMessage =
      process.env.NODE_ENV === "production"
        ? "An error occurred while processing your request. Please try again later."
        : errorMessage;

    return NextResponse.json(
      { error: sanitizedMessage },
      {
        status: 500,
        headers: {
          "X-Request-ID": requestId,
        },
      }
    );
  }
}
