"use client";

import { useEffect, useRef, useState } from "react";

import { type ApiError, ApiErrorBanner } from "@/components/api-error-banner";
import { ChatHeader } from "@/components/chat-header";
import { ChatInput } from "@/components/chat-input";
import { ChatMessage } from "@/components/chat-message";
import { generateMessageId } from "@/constants";
import { cn } from "@/lib/utils";
import { type Message } from "@/types";
import { isPeacockApiError } from "@/utils/api-error";

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<ApiError | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (content: string) => {
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
      const response = await fetch("/api/agent", {
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

        // Check if it's an API error from Peacock API
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
      // Clear any previous API errors on success
      setApiError(null);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "An error occurred";

      // Check if this is a Peacock API error
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
  };

  const handleClearError = (): void => {
    setApiError(null);
  };

  return (
    <div
      className={cn(
        "flex h-d-screen flex-col",
        "bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20"
      )}
    >
      <ChatHeader />
      <ApiErrorBanner error={apiError} onClear={handleClearError} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="mx-auto w-full max-w-4xl flex-1 overflow-y-auto px-4 py-6">
          {messages.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-center text-muted-foreground">
                <p className="text-lg">
                  Start a conversation with the AI agent...
                </p>
                <p className="mt-2 text-sm">
                  Ask about members, loans, transactions, or club information
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <ChatMessage key={message.messageId} message={message} />
              ))}
              {isLoading && (
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
                    AI
                  </div>
                  <div className="flex items-center gap-2 rounded-lg bg-card px-4 py-3 text-card-foreground shadow-sm">
                    <div className="flex gap-1">
                      <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
                      <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
                      <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" />
                    </div>
                    <span className="text-sm text-muted-foreground">
                      Thinking...
                    </span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
        <ChatInput onSend={handleSendMessage} disabled={isLoading} />
      </div>
    </div>
  );
}
