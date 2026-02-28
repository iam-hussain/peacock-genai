"use client";

import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import remarkGfm from "remark-gfm";

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
  if (
    message.type === "table" &&
    typeof message.content === "object" &&
    message.content !== null &&
    "headers" in message.content
  ) {
    const tableData = message.content as {
      headers?: string[];
      rows?: (string | number)[][];
      caption?: string;
    };
    return (
      <Table
        data={{
          headers: Array.isArray(tableData.headers) ? tableData.headers : [],
          rows: Array.isArray(tableData.rows) ? tableData.rows : [],
          caption: tableData.caption,
        }}
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
        }}
      />
    );
  }

  if (message.type === "text" && typeof message.content === "string") {
    const content = message.content.trim();
    if (!content) {
      return <div className="text-sm text-muted-foreground">(empty)</div>;
    }

    const parsed = parseMessageContent(content);
    if (
      parsed.type === "table" &&
      typeof parsed.data === "object" &&
      parsed.data !== null &&
      "headers" in parsed.data
    ) {
      const tableData = parsed.data as {
        headers?: string[];
        rows?: (string | number)[][];
        caption?: string;
      };
      return (
        <Table
          data={{
            headers: Array.isArray(tableData.headers) ? tableData.headers : [],
            rows: Array.isArray(tableData.rows) ? tableData.rows : [],
            caption: tableData.caption,
          }}
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

    return (
      <div className="prose prose-sm max-w-none text-[15px] leading-relaxed [&_*]:text-inherit prose-headings:scroll-mt-20 prose-h2:scroll-mt-20 prose-h3:scroll-mt-20 prose-pre:bg-muted prose-pre:border prose-pre:border-border prose-pre:rounded-lg prose-pre:overflow-x-auto prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:before:content-none prose-code:after:content-none">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeHighlight]}
          components={{
            h2: ({ children }) => (
              <h2 className="scroll-mt-20 text-base font-semibold text-foreground mt-4 mb-2">
                {children}
              </h2>
            ),
            h3: ({ children }) => (
              <h3 className="scroll-mt-20 text-sm font-semibold text-foreground mt-3 mb-1">
                {children}
              </h3>
            ),
            pre: ({ children }) => (
              <pre className="bg-muted border border-border rounded-lg p-4 overflow-x-auto text-sm my-3">
                {children}
              </pre>
            ),
            code: ({ className, children, ...props }) => {
              const isInline = !className;
              return isInline ? (
                <code
                  className="bg-muted px-1.5 py-0.5 rounded text-sm"
                  {...props}
                >
                  {children}
                </code>
              ) : (
                <code className={className} {...props}>
                  {children}
                </code>
              );
            },
            table: ({ children }) => (
              <div className="my-3 max-h-[420px] overflow-x-auto overflow-y-auto rounded-xl border border-border bg-card shadow-sm">
                <table className="w-full table-auto border-collapse">
                  {children}
                </table>
              </div>
            ),
            thead: ({ children }) => (
              <thead className="sticky top-0 z-10 bg-muted/95 backdrop-blur">
                {children}
              </thead>
            ),
            tbody: ({ children }) => (
              <tbody className="divide-y divide-border bg-background">
                {children}
              </tbody>
            ),
            tr: ({ children }) => (
              <tr className="transition-colors hover:bg-muted/40 [&:nth-child(even)]:bg-muted/20">
                {children}
              </tr>
            ),
            th: ({ children }) => (
              <th className="whitespace-nowrap border-b-2 border-border px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-foreground">
                {children}
              </th>
            ),
            td: ({ children }) => (
              <td className="whitespace-nowrap px-4 py-3 text-sm font-variant-numeric tabular-nums text-foreground">
                {children}
              </td>
            ),
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    );
  }

  return (
    <div className="text-sm text-foreground">{String(message.content)}</div>
  );
}

export function ChatMessage({ message }: ChatMessageProps): JSX.Element {
  const isUser = message.sender === "user";
  const isError = message.status === "error";

  return (
    <div
      className={cn(
        "flex items-start gap-2 sm:gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300",
        isUser && "flex-row-reverse"
      )}
    >
      <div
        className={cn(
          "flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full font-semibold text-sm sm:text-base",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-secondary text-secondary-foreground"
        )}
      >
        {isUser ? "U" : "AI"}
      </div>
      <div
        className={cn(
          "flex max-w-[85%] sm:max-w-2xl flex-col gap-2 rounded-lg px-3 py-2.5 sm:px-4 sm:py-3",
          isUser
            ? "bg-primary/90 text-primary-foreground"
            : isError
              ? "bg-destructive/10 text-destructive border border-destructive/20"
              : "bg-card text-card-foreground shadow-sm border border-border/50 sm:border-l-4 sm:border-l-primary/30"
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
