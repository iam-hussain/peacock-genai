"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";

import {
  type ApiError,
  ApiErrorBanner,
} from "@/components/molecules/api-error-banner";
import { ChatInput } from "@/components/molecules/chat-input";
import { DocMention } from "@/components/molecules/doc-mention";
import { ChatHeader } from "@/components/organisms/chat-header";
import { ChatMessage } from "@/components/organisms/chat-message";
import { cn } from "@/lib/utils";
import { type Message } from "@/types";
import { isPeacockApiError } from "@/utils/api-error";
import { generateMessageId } from "@/utils/constants";

function ChatPageContent() {
  const searchParams = useSearchParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [apiError, setApiError] = useState<ApiError | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const hasExecutedPromptRef = useRef(false);
  const handleSendMessageRef = useRef<
    ((content: string) => Promise<void>) | null
  >(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    let cancelled = false;

    const loadHistory = async () => {
      try {
        const res = await fetch("/api/chat/history", {
          credentials: "include",
        });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && Array.isArray(data.messages)) {
          setMessages(data.messages);
        }
      } catch {
        // Ignore fetch errors
      } finally {
        if (!cancelled) {
          setIsLoadingHistory(false);
          requestAnimationFrame(() => inputRef.current?.focus());
        }
      }
    };

    loadHistory();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const prompt = searchParams.get("prompt");
    if (prompt?.trim() && !hasExecutedPromptRef.current && !isLoadingHistory) {
      hasExecutedPromptRef.current = true;
      window.history.replaceState({}, "", "/chat");
      handleSendMessageRef.current?.(prompt.trim());
    }
  }, [searchParams, isLoadingHistory]);

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
  };

  const handleClearError = (): void => {
    setApiError(null);
  };

  handleSendMessageRef.current = handleSendMessage;

  return (
    <div
      className={cn(
        "flex h-d-screen flex-col",
        "bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20"
      )}
    >
      <ChatHeader />
      <ApiErrorBanner error={apiError} onClear={handleClearError} />
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="mx-auto w-full max-w-3xl flex-1 overflow-y-auto px-3 py-6 sm:px-4 md:px-6">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-6">
              {isLoadingHistory ? (
                <p className="text-sm text-muted-foreground">
                  Loading conversation...
                </p>
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-8 px-4">
                  <div className="flex flex-col items-center gap-4 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="32"
                        height="32"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden
                      >
                        <path d="M4 22v-5a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v5" />
                        <path d="M16 12a4 4 0 0 1-8 0" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-foreground">
                        Ask about members, loans, transactions
                      </h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Get insights from your Peacock data
                      </p>
                    </div>
                  </div>
                  <div className="flex w-full max-w-md flex-col gap-4">
                    <div>
                      <h3 className="mb-2 text-center text-sm font-medium text-foreground">
                        Try these
                      </h3>
                      <DocMention
                        onSelect={handleSendMessage}
                        disabled={isLoading}
                      />
                    </div>
                    <p className="text-center text-xs text-muted-foreground">
                      Or type your own question below
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div
              className="space-y-4 md:space-y-6"
              role="log"
              aria-live="polite"
            >
              {messages.map((message) => (
                <ChatMessage key={message.messageId} message={message} />
              ))}
              {isLoading && (
                <div
                  className="flex items-start gap-2 sm:gap-3"
                  role="status"
                  aria-live="polite"
                  aria-label="AI is thinking"
                >
                  <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground text-sm sm:text-base">
                    AI
                  </div>
                  <div className="flex flex-col gap-2 rounded-lg bg-card px-4 py-3 shadow-sm">
                    <div className="flex flex-col gap-2">
                      <div className="h-3 w-48 animate-pulse rounded bg-muted" />
                      <div className="h-3 w-40 animate-pulse rounded bg-muted" />
                      <div className="h-3 w-36 animate-pulse rounded bg-muted" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
        <div className="shrink-0">
          <ChatInput
            onSend={handleSendMessage}
            disabled={isLoading}
            inputRef={inputRef}
          />
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-d-screen flex-col bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20">
          <ChatHeader />
          <div className="flex min-h-0 flex-1 items-center justify-center">
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        </div>
      }
    >
      <ChatPageContent />
    </Suspense>
  );
}
