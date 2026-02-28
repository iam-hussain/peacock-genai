/**
 * Chat feature: message history and stream management
 * Extracted from ChatPage for reuse
 */

import { useCallback, useEffect, useRef, useState } from "react";

import { type ApiError } from "@/components/molecules/api-error-banner";
import { type Message } from "@/types";
import { isPeacockApiError } from "@/utils/api-error";
import { generateMessageId } from "@/utils/constants";

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<ApiError | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading) return;

      const userMessage: Message = {
        messageId: generateMessageId(),
        type: "text",
        content: content.trim(),
        sender: "user",
        receiver: "assistant",
        timestamp: new Date().toISOString(),
        status: "sent",
        error: null,
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(userMessage),
        });

        if (!response.ok) {
          const errorData = await response.json();
          const errorMessage =
            errorData.error || "Failed to get response from the server";

          if (errorData.apiError) {
            setApiError({
              id: generateMessageId(),
              message: errorMessage,
              timestamp: new Date(),
              endpoint: errorData.endpoint,
            });
          }

          throw new Error(errorMessage);
        }

        const responseMessage: Message = await response.json();
        setMessages((prev) => [...prev, responseMessage]);
        setApiError(null);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "An error occurred";

        if (isPeacockApiError(error)) {
          setApiError({
            id: generateMessageId(),
            message: errorMessage,
            timestamp: new Date(),
            endpoint:
              error instanceof Error && "apiErrorInfo" in error
                ? (error as Error & { apiErrorInfo: { endpoint: string } })
                    .apiErrorInfo.endpoint
                : undefined,
          });
        }

        const errorMsg: Message = {
          messageId: generateMessageId(),
          type: "text",
          content: errorMessage,
          sender: "assistant",
          receiver: "user",
          timestamp: new Date().toISOString(),
          status: "error",
          error: errorMessage,
        };
        setMessages((prev) => [...prev, errorMsg]);
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading]
  );

  const clearError = useCallback(() => {
    setApiError(null);
  }, []);

  return {
    messages,
    isLoading,
    apiError,
    messagesEndRef,
    sendMessage,
    clearError,
  };
}
