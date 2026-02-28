import { HumanMessage } from "@langchain/core/messages";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  getChatHistory,
  persistAiMessage,
  persistUserMessage,
} from "./chat-history";
import {
  extractResponseContent,
  extractTokenUsage,
} from "./response-extractor";

import { createSupervisorGraph } from "@/ai/graph";
import { getPeacockApiUrl } from "@/lib/auth";
import { measureTime } from "@/lib/performance";
import {
  checkRateLimit,
  getClientIdentifier,
  type RateLimitConfig,
} from "@/lib/rate-limit";
import { getRequestIdFromHeaders } from "@/lib/request-id";
import { incomingMessageSchema, type Message } from "@/types";
import { formatApiError, isPeacockApiError } from "@/utils/api-error";
import {
  generateMessageId,
  MESSAGE_SENDER,
  MESSAGE_STATUS,
} from "@/utils/constants";
import { detectErrorType } from "@/utils/error-detection";
import { logger } from "@/utils/logger";

const RATE_LIMIT_CONFIG: RateLimitConfig = {
  maxRequests: 30,
  windowMs: 60 * 1000,
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

/**
 * POST /api/chat
 * Chat endpoint for interacting with the LangChain agent
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const requestId = getRequestIdFromHeaders(req.headers);

  try {
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

    const agentGraph = createSupervisorGraph();

    let userId: string | null = null;
    let accessLevel: "READ" | "WRITE" | "ADMIN" = "READ";
    const cookie = req.headers.get("cookie");
    const sessionId = getClientIdentifier(req);

    if (cookie) {
      try {
        const authResponse = await fetch(`${getPeacockApiUrl()}/api/auth/me`, {
          headers: { Cookie: cookie },
        });
        if (authResponse.ok) {
          const authData = await authResponse.json();
          const user = authData.user;
          userId = user?.id || null;
          const level = user?.accessLevel;
          if (level === "ADMIN" || level === "SUPER_ADMIN") {
            accessLevel = "ADMIN";
          } else if (level === "WRITE") {
            accessLevel = "WRITE";
          }
        }
      } catch {
        // Ignore auth fetch errors
      }
    }

    const chatHistory = await getChatHistory(userId, sessionId);

    const messageContent =
      typeof incomingMessage.content === "string"
        ? incomingMessage.content.trim()
        : String(incomingMessage.content);

    await persistUserMessage(messageContent, userId, sessionId);

    const { result, duration } = await measureTime(
      async () =>
        agentGraph.invoke(
          {
            messages: [...chatHistory, new HumanMessage(messageContent)],
            next: "supervisor",
            auth: { accessLevel, userId },
          },
          { recursionLimit: 100 }
        ),
      `Agent invocation [${requestId}]`
    );

    logger.info("Agent response received", {
      requestId,
      duration: `${duration.toFixed(2)}ms`,
    });

    const responseContent = extractResponseContent(result);
    const tokenUsage = extractTokenUsage(result);

    if (tokenUsage) {
      logger.info(
        "Token usage",
        {
          promptTokens: tokenUsage.promptTokens || 0,
          completionTokens: tokenUsage.completionTokens || 0,
          totalTokens: tokenUsage.totalTokens || 0,
        },
        requestId
      );
    }

    const { parseMessageContent } = await import("@/utils/message-parser");
    const parsed = parseMessageContent(responseContent || "");

    if (responseContent) {
      await persistAiMessage(responseContent, userId, sessionId);
    }

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

    const errorInfo = detectErrorType(error);

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
