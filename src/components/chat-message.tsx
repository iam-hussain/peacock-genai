"use client";

import ReactMarkdown from "react-markdown";

import { Card } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { List } from "@/components/ui/list";
import { Table } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { type Message } from "@/types";
import { parseMessageContent } from "@/utils/message-parser";

interface ChatMessageProps {
  message: Message;
}

function renderMessageContent(message: Message): JSX.Element {
  // If message type is explicitly set, use it
  if (
    message.type === "table" &&
    typeof message.content === "object" &&
    "headers" in message.content
  ) {
    return (
      <Table
        data={
          message.content as {
            headers: string[];
            rows: (string | number)[][];
            caption?: string;
          }
        }
      />
    );
  }

  if (
    message.type === "list" &&
    typeof message.content === "object" &&
    "items" in message.content
  ) {
    return (
      <List
        data={
          message.content as {
            items: string[];
            ordered?: boolean;
            title?: string;
          }
        }
      />
    );
  }

  if (
    message.type === "card" &&
    typeof message.content === "object" &&
    "title" in message.content
  ) {
    return (
      <Card
        data={
          message.content as {
            title: string;
            description?: string;
            items?: Array<{ label: string; value: string | number }>;
            footer?: string;
          }
        }
      />
    );
  }

  if (
    message.type === "form" &&
    typeof message.content === "object" &&
    "fields" in message.content
  ) {
    return (
      <Form
        data={
          message.content as {
            fields: Array<{
              name: string;
              label: string;
              type: "text" | "number" | "email" | "date" | "select";
              value?: string | number;
              options?: string[];
              required?: boolean;
            }>;
            submitLabel?: string;
            title?: string;
          }
        }
        onSubmit={(values) => {
          console.log("Form submitted:", values);
          // TODO: Handle form submission
        }}
      />
    );
  }

  // If message type is text and content is a string, render as markdown
  if (message.type === "text" && typeof message.content === "string") {
    return (
      <div className="prose prose-sm max-w-none dark:prose-invert">
        <ReactMarkdown
          components={{
            table: ({ children }) => (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-border border border-border rounded-lg">
                  {children}
                </table>
              </div>
            ),
            thead: ({ children }) => (
              <thead className="bg-muted">{children}</thead>
            ),
            tbody: ({ children }) => (
              <tbody className="divide-y divide-border bg-background">
                {children}
              </tbody>
            ),
            tr: ({ children }) => (
              <tr className="hover:bg-muted/50 transition-colors">
                {children}
              </tr>
            ),
            th: ({ children }) => (
              <th className="px-4 py-2 text-left text-sm font-semibold text-foreground">
                {children}
              </th>
            ),
            td: ({ children }) => (
              <td className="px-4 py-2 text-sm text-foreground">{children}</td>
            ),
          }}
        >
          {message.content}
        </ReactMarkdown>
      </div>
    );
  }

  // If content is a string but type is not explicitly set, try to parse it (fallback for legacy messages)
  if (typeof message.content === "string" && message.type === "text") {
    const parsed = parseMessageContent(message.content);

    if (
      parsed.type === "table" &&
      typeof parsed.data === "object" &&
      "headers" in parsed.data
    ) {
      return (
        <Table
          data={
            parsed.data as {
              headers: string[];
              rows: (string | number)[][];
              caption?: string;
            }
          }
        />
      );
    }

    if (
      parsed.type === "list" &&
      typeof parsed.data === "object" &&
      "items" in parsed.data
    ) {
      return (
        <List
          data={
            parsed.data as {
              items: string[];
              ordered?: boolean;
              title?: string;
            }
          }
        />
      );
    }

    // Render as markdown text
    return (
      <div className="prose prose-sm max-w-none dark:prose-invert">
        <ReactMarkdown
          components={{
            table: ({ children }) => (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-border border border-border rounded-lg">
                  {children}
                </table>
              </div>
            ),
            thead: ({ children }) => (
              <thead className="bg-muted">{children}</thead>
            ),
            tbody: ({ children }) => (
              <tbody className="divide-y divide-border bg-background">
                {children}
              </tbody>
            ),
            tr: ({ children }) => (
              <tr className="hover:bg-muted/50 transition-colors">
                {children}
              </tr>
            ),
            th: ({ children }) => (
              <th className="px-4 py-2 text-left text-sm font-semibold text-foreground">
                {children}
              </th>
            ),
            td: ({ children }) => (
              <td className="px-4 py-2 text-sm text-foreground">{children}</td>
            ),
          }}
        >
          {message.content}
        </ReactMarkdown>
      </div>
    );
  }

  // Fallback to string representation
  return (
    <div className="text-sm text-foreground">{String(message.content)}</div>
  );
}

export function ChatMessage({ message }: ChatMessageProps): JSX.Element {
  const isUser = message.sender === "user";
  const isError = message.status === "error";

  return (
    <div className={cn("flex items-start gap-3", isUser && "flex-row-reverse")}>
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-semibold",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-secondary text-secondary-foreground"
        )}
      >
        {isUser ? "U" : "AI"}
      </div>
      <div
        className={cn(
          "flex max-w-[85%] flex-col gap-2 rounded-lg px-4 py-3",
          isUser
            ? "bg-primary text-primary-foreground"
            : isError
              ? "bg-destructive/10 text-destructive border border-destructive/20"
              : "bg-card text-card-foreground shadow-sm border border-border/50"
        )}
      >
        <div className="min-w-0">{renderMessageContent(message)}</div>
        <div
          className={cn(
            "text-xs opacity-60 mt-1",
            isUser ? "text-right" : "text-left"
          )}
        >
          {new Date(message.timestamp).toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
}
