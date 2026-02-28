/**
 * Account & Directory Tools
 * Identity and status filtering (Account model)
 */

import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";

import { peacockFetch } from "@/lib/auth";

interface AccountRecord {
  id: string;
  type?: string;
  status?: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  phone?: string;
  active?: boolean;
  [key: string]: unknown;
}

function filterByStatus(
  accounts: AccountRecord[],
  status: "ACTIVE" | "INACTIVE" | "ALL"
): AccountRecord[] {
  if (status === "ALL") return accounts;
  const isActive = status === "ACTIVE";
  return accounts.filter(
    (a) => (a.active ?? a.status === "ACTIVE") === isActive
  );
}

export function createAccountTools() {
  return [
    new DynamicStructuredTool({
      name: "fetch_accounts",
      description:
        "Retrieves members or vendors. Returns id, firstName, lastName, username, phone, status. Use for lists with full details.",
      schema: z.object({
        category: z
          .enum(["MEMBER", "VENDOR"])
          .describe("Account category: MEMBER or VENDOR"),
        status: z
          .enum(["ACTIVE", "INACTIVE", "ALL"])
          .default("ALL")
          .describe("Filter by status: ACTIVE, INACTIVE, or ALL"),
        searchQuery: z
          .string()
          .optional()
          .describe("Optional search string (name, username, phone)"),
      }),
      func: async ({ category, status, searchQuery }) => {
        try {
          let rawAccounts: AccountRecord[];

          if (searchQuery?.trim()) {
            const response = await peacockFetch("/api/search", {
              method: "POST",
              body: JSON.stringify({ searchQuery: searchQuery.trim() }),
            });
            if (!response.ok) {
              const errorText = await response.text();
              throw new Error(`API Error ${response.status}: ${errorText}`);
            }
            const data = (await response.json()) as {
              members?: AccountRecord[];
              vendors?: AccountRecord[];
            };
            rawAccounts =
              category === "MEMBER"
                ? (data.members ?? [])
                : (data.vendors ?? []);
          } else {
            const response = await peacockFetch("/api/info", {
              method: "GET",
            });
            if (!response.ok) {
              const errorText = await response.text();
              throw new Error(`API Error ${response.status}: ${errorText}`);
            }
            const data = (await response.json()) as {
              member?: AccountRecord[];
              vendor?: AccountRecord[];
            };
            rawAccounts =
              category === "MEMBER" ? (data.member ?? []) : (data.vendor ?? []);
          }

          const withStatus = rawAccounts.map((a) => ({
            ...a,
            type: category,
            status: a.active ? "ACTIVE" : "INACTIVE",
          }));
          const filtered = filterByStatus(withStatus, status);

          return JSON.stringify({
            category,
            status,
            count: filtered.length,
            accounts: filtered.map((a) => ({
              id: a.id,
              firstName: a.firstName,
              lastName: a.lastName,
              username: a.username,
              phone: a.phone,
              status: a.status,
              startedAt: a.startedAt,
              active: a.active,
            })),
          });
        } catch (error: unknown) {
          const msg = error instanceof Error ? error.message : String(error);
          return `Error fetching accounts: ${msg}`;
        }
      },
    }),

    new DynamicStructuredTool({
      name: "get_member_profile",
      description:
        "Fetches the FULL profile for a specific member by username. POST /api/account/member/{username}. Returns ALL fields: id, username, firstName, lastName, phone, active, clubHeldAmount, loanHistory, interestBalance, currentLoanTaken, passbookId, startedAt, endedAt, and any other API fields. Use for: 'full loan details of X', 'all details of X', 'give me details of cibi'.",
      schema: z.object({
        username: z.string().describe("Member username (e.g. javid, sampath)"),
      }),
      func: async ({ username }) => {
        try {
          const response = await peacockFetch(
            `/api/account/member/${encodeURIComponent(username)}`,
            {
              method: "POST",
              body: JSON.stringify({}),
            }
          );

          if (!response.ok) {
            if (response.status === 404) {
              return `Member not found: ${username}`;
            }
            const errorText = await response.text();
            throw new Error(`API Error ${response.status}: ${errorText}`);
          }

          const data = await response.json();
          return JSON.stringify(data);
        } catch (error: unknown) {
          const msg = error instanceof Error ? error.message : String(error);
          return `Error fetching member profile: ${msg}`;
        }
      },
    }),

    new DynamicStructuredTool({
      name: "get_members_holding_club_money",
      description:
        "Returns members who are holding club money (clubHeldAmount > 0). clubHeldAmount is money in rupees belonging to the club that members keep safe. Use for: 'Who are holding club money?', 'Who has club funds?', 'List members holding club cash'. Uses /api/account/member for a single optimized call.",
      schema: z.object({}),
      func: async () => {
        try {
          const response = await peacockFetch("/api/account/member", {
            method: "POST",
            body: JSON.stringify({}),
          });
          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API Error ${response.status}: ${errorText}`);
          }

          const data = (await response.json()) as {
            member?: Array<{
              username?: string;
              firstName?: string;
              lastName?: string;
              clubHeldAmount?: number;
            }>;
            members?: Array<{
              username?: string;
              firstName?: string;
              lastName?: string;
              clubHeldAmount?: number;
            }>;
          };

          const list = data.member ?? data.members ?? [];
          const holders = list
            .filter((m) => {
              const amount =
                typeof m.clubHeldAmount === "number" ? m.clubHeldAmount : 0;
              return amount > 0;
            })
            .map((m) => {
              const name = [m.firstName, m.lastName]
                .filter(Boolean)
                .join(" ")
                .trim();
              return {
                name: name || m.username || "—",
                username: m.username || "—",
                clubHeldAmount: m.clubHeldAmount as number,
              };
            })
            .sort((a, b) => b.clubHeldAmount - a.clubHeldAmount);

          return JSON.stringify({
            count: holders.length,
            totalHeld: holders.reduce((sum, h) => sum + h.clubHeldAmount, 0),
            members: holders.map((h) => ({
              name: h.name,
              username: h.username,
              clubHeldAmount: h.clubHeldAmount,
              clubHeldAmountFormatted: `₹${h.clubHeldAmount.toLocaleString("en-IN")}`,
            })),
          });
        } catch (error: unknown) {
          const msg = error instanceof Error ? error.message : String(error);
          return `Error fetching members holding club money: ${msg}`;
        }
      },
    }),
  ];
}
