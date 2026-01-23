/**
 * Message Parser
 * Parses agent responses and extracts structured UI components
 */

import {
  type CardData,
  type FormData,
  type ListData,
  type MessageContent,
  type TableData,
} from "@/types";

type JsonPayload =
  | {
      type: "table";
      title?: string;
      columns?: string[];
      headers?: string[];
      rows?: (string | number)[];
      data?: (string | number)[][];
    }
  | {
      type: "options";
      label?: string;
      options?: Array<{ value: string; label: string }>;
    }
  | {
      type: "cards";
      items?: Array<{
        title: string;
        value: string | number;
        helpText?: string;
      }>;
      title?: string;
    }
  | {
      type: "list";
      items?: string[];
      ordered?: boolean;
      title?: string;
    }
  | { type: "text"; content?: string; message?: string; text?: string };

function parseJsonPayload(content: string): {
  type: "text" | "table" | "list" | "form" | "card";
  data: MessageContent;
} | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    return null;
  }

  if (!parsed || typeof parsed !== "object" || !("type" in parsed)) return null;
  const payload = parsed as JsonPayload;

  if (payload.type === "table") {
    const headers = payload.columns || payload.headers;
    const rows = Array.isArray(payload.data) ? payload.data : payload.rows;
    if (Array.isArray(headers) && Array.isArray(rows)) {
      const tableData: TableData = {
        headers: headers.map(String),
        rows: rows.map((r) =>
          Array.isArray(r) ? r.map((c) => c as string | number) : []
        ),
        caption: payload.title,
      };
      return { type: "table", data: tableData };
    }
  }

  if (payload.type === "options" && Array.isArray(payload.options)) {
    const formData: FormData = {
      title: payload.label,
      fields: [
        {
          name: "selection",
          label: payload.label || "Choose an option",
          type: "select",
          options: payload.options.map((o) => o.label ?? String(o.value)),
          value: payload.options[0]?.value,
        },
      ],
      submitLabel: "Select",
    };
    return { type: "form", data: formData };
  }

  if (payload.type === "cards" && Array.isArray(payload.items)) {
    const cardData: CardData = {
      title: payload.title || "Details",
      items: payload.items.map((i) => ({
        label: i.title,
        value: i.value,
      })),
    };
    return { type: "card", data: cardData };
  }

  if (payload.type === "list" && Array.isArray(payload.items)) {
    const listData: ListData = {
      items: payload.items,
      ordered: payload.ordered,
      title: payload.title,
    };
    return { type: "list", data: listData };
  }

  if (payload.type === "text") {
    const text = payload.content ?? payload.message ?? payload.text ?? "";
    return { type: "text", data: text };
  }

  return null;
}

/**
 * Parse markdown table from string content
 */
export function parseMarkdownTable(content: string): TableData | null {
  const lines = content.split("\n").filter((line) => line.trim());
  const tableStart = lines.findIndex((line) => line.includes("|"));

  if (tableStart === -1) return null;

  const tableLines = lines.slice(tableStart);
  const separatorIndex = tableLines.findIndex((line) =>
    line.match(/^\|[\s\-:|]+\|$/)
  );

  if (separatorIndex === -1 || separatorIndex === 0) return null;

  const headerLine = tableLines[0];
  if (!headerLine) return null;
  const dataLines = tableLines.slice(separatorIndex + 1);

  const headers = headerLine
    .split("|")
    .map((h) => h.trim())
    .filter((h) => h);

  if (headers.length === 0) return null;

  const rows = dataLines
    .filter((line) => line.includes("|"))
    .map((line) =>
      line
        .split("|")
        .map((cell) => cell.trim())
        .filter((_, index, arr) => index > 0 && index < arr.length - 1)
    )
    .filter((row) => row.length === headers.length);

  if (rows.length === 0) return null;

  return {
    headers,
    rows,
  };
}

/**
 * Parse markdown list from string content
 * Also handles cases where agent adds explanatory text before the list
 */
export function parseMarkdownList(content: string): ListData | null {
  const lines = content.split("\n").filter((line) => line.trim());

  // Check for ordered list (1., 2., etc.)
  const orderedMatch = lines.find((line) => /^\d+\.\s+/.test(line));
  if (orderedMatch) {
    const items = lines
      .filter((line) => /^\d+\.\s+/.test(line))
      .map((line) => line.replace(/^\d+\.\s+/, "").trim());

    if (items.length > 0) {
      return { items, ordered: true };
    }
  }

  // Check for unordered list (-, *, etc.)
  // Also extract list items even if there's explanatory text before them
  const unorderedMatch = lines.find((line) => /^[-*]\s+/.test(line));
  if (unorderedMatch) {
    const items = lines
      .filter((line) => /^[-*]\s+/.test(line))
      .map((line) => line.replace(/^[-*]\s+/, "").trim());

    if (items.length > 0) {
      return { items, ordered: false };
    }
  }

  // If no list found, check if content contains a list pattern but with explanatory text
  // Look for lines that match member list format: "Name - Status" or "Name - Status, Loan Balance: X"
  const memberListPattern =
    /^[-*]\s+.+?\s-\s(Active|Inactive)(?:,\sLoan Balance:\s.+)?$/;
  const memberListItems = lines.filter((line) => memberListPattern.test(line));
  if (memberListItems.length > 0) {
    const items = memberListItems.map((line) => {
      // Remove the list marker if present
      return line.replace(/^[-*]\s+/, "").trim();
    });
    return { items, ordered: false };
  }

  return null;
}

/**
 * Parse message content and detect UI components
 */
export function parseMessageContent(content: string): {
  type: "text" | "table" | "list" | "form" | "card";
  data: MessageContent;
} {
  // Try structured JSON payload first
  const jsonParsed = parseJsonPayload(content);
  if (jsonParsed) return jsonParsed;

  // Try to parse as table first
  const tableData = parseMarkdownTable(content);
  if (tableData) {
    return { type: "table", data: tableData };
  }

  // Try to parse as list
  const listData = parseMarkdownList(content);
  if (listData) {
    return { type: "list", data: listData };
  }

  // Default to text
  return { type: "text", data: content };
}
