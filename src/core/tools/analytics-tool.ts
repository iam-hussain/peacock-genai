/**
 * Financial Ledger & Analytics Tools (Summary Model)
 * Time-series data for dashboard graphs
 */

import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";

import { peacockFetch } from "@/lib/auth";

export function createAnalyticsTools() {
  return [
    new DynamicStructuredTool({
      name: "get_dashboard_snapshot",
      description:
        "Get financial snapshot for a specific month. Returns Summary: availableCash, totalInvested, currentValue, currentLoanTaken, interestBalance.",
      schema: z.object({
        month: z
          .string()
          .regex(/^\d{4}-\d{2}$/, "Use YYYY-MM format")
          .describe("Month in YYYY-MM format (e.g. 2024-01)"),
      }),
      func: async ({ month }) => {
        try {
          const response = await peacockFetch(
            `/api/dashboard/summary?month=${month}`,
            { method: "GET" }
          );

          if (!response.ok) {
            if (response.status === 404) {
              return `No summary found for month ${month}`;
            }
            const errorText = await response.text();
            throw new Error(`API Error ${response.status}: ${errorText}`);
          }

          const data = await response.json();
          return JSON.stringify(data);
        } catch (error: unknown) {
          const msg = error instanceof Error ? error.message : String(error);
          return `Error fetching dashboard snapshot: ${msg}`;
        }
      },
    }),

    new DynamicStructuredTool({
      name: "get_financial_analytics",
      description:
        "Fetches time-series data for dashboard graphs. Use for trends, performance tracking.",
      schema: z.object({
        from: z
          .string()
          .regex(/^\d{4}-\d{2}$/, "Use YYYY-MM format")
          .describe("Start month (YYYY-MM)"),
        to: z
          .string()
          .regex(/^\d{4}-\d{2}$/, "Use YYYY-MM format")
          .describe("End month (YYYY-MM)"),
      }),
      func: async ({ from, to }) => {
        try {
          const response = await peacockFetch(
            `/api/dashboard/graphs?from=${from}&to=${to}`,
            { method: "GET" }
          );

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API Error ${response.status}: ${errorText}`);
          }

          const data = await response.json();
          return JSON.stringify({ from, to, ...data });
        } catch (error: unknown) {
          const msg = error instanceof Error ? error.message : String(error);
          return `Error fetching financial analytics: ${msg}`;
        }
      },
    }),
  ];
}
