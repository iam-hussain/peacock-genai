/**
 * Vendor & Investment Tools
 * External entities and investment performance
 */

import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";

import { peacockFetch } from "@/lib/auth";

interface VendorRecord {
  id: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  status?: string;
  active?: boolean;
  [key: string]: unknown;
}

function filterByStatus(
  vendors: VendorRecord[],
  status: "ACTIVE" | "INACTIVE" | "ALL"
): VendorRecord[] {
  if (status === "ALL") return vendors;
  const isActive = status === "ACTIVE";
  return vendors.filter(
    (v) => (v.active ?? v.status === "ACTIVE") === isActive
  );
}

export function createVendorTools() {
  return [
    new DynamicStructuredTool({
      name: "list_vendors",
      description:
        "Returns a filtered list of vendors (Chit funds, Banks). Use for: 'Show active vendors', 'List inactive vendors'.",
      schema: z.object({
        status: z
          .enum(["ACTIVE", "INACTIVE", "ALL"])
          .default("ALL")
          .describe("Filter by status: ACTIVE, INACTIVE, or ALL"),
      }),
      func: async ({ status }) => {
        try {
          const response = await peacockFetch("/api/info", {
            method: "GET",
          });

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API Error ${response.status}: ${errorText}`);
          }

          const data = (await response.json()) as {
            vendor?: VendorRecord[];
          };
          const rawVendors = data.vendor ?? [];
          const filtered = filterByStatus(rawVendors, status);

          return JSON.stringify({
            count: filtered.length,
            status,
            vendors: filtered.map((v) => ({
              id: v.id,
              firstName: v.firstName,
              lastName: v.lastName,
              username: v.username,
              status: v.active ? "ACTIVE" : "INACTIVE",
            })),
          });
        } catch (error: unknown) {
          const msg = error instanceof Error ? error.message : String(error);
          return `Error listing vendors: ${msg}`;
        }
      },
    }),

    new DynamicStructuredTool({
      name: "get_vendor_returns",
      description:
        "Analyzes profit and performance. Returns dashboard summary with totalInvested, currentValue, vendor investment data for a month.",
      schema: z.object({
        month: z
          .string()
          .regex(/^\d{4}-\d{2}$/, "Use YYYY-MM format")
          .optional()
          .describe(
            "Month in YYYY-MM format. If not provided, returns latest summary."
          ),
      }),
      func: async ({ month }) => {
        try {
          const path = month
            ? `/api/dashboard/summary?month=${month}`
            : "/api/dashboard/summary";
          const response = await peacockFetch(path, { method: "GET" });

          if (!response.ok) {
            if (response.status === 404) {
              return `No summary found for month ${month ?? "latest"}`;
            }
            const errorText = await response.text();
            throw new Error(`API Error ${response.status}: ${errorText}`);
          }

          const data = await response.json();
          return JSON.stringify(data);
        } catch (error: unknown) {
          const msg = error instanceof Error ? error.message : String(error);
          return `Error fetching vendor returns: ${msg}`;
        }
      },
    }),
  ];
}
