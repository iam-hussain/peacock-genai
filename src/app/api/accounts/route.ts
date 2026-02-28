import { NextResponse } from "next/server";

import { peacockFetch } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface AccountRecord {
  id: string;
  type?: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  [key: string]: unknown;
}

/**
 * GET /api/accounts
 * Fetches members and vendors from Peacock API for transaction form dropdowns
 */
export async function GET() {
  try {
    const response = await peacockFetch("/api/info", { method: "GET" });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `Failed to fetch accounts: ${errorText}` },
        { status: response.status }
      );
    }

    const data = (await response.json()) as {
      member?: AccountRecord[];
      vendor?: AccountRecord[];
      club?: AccountRecord[];
    };

    const members = (data.member ?? []).map((m) => ({
      id: m.id,
      label:
        [m.firstName, m.lastName].filter(Boolean).join(" ") ||
        m.username ||
        m.id,
      username: m.username,
      type: "MEMBER",
    }));

    const vendors = (data.vendor ?? []).map((v) => ({
      id: v.id,
      label:
        [v.firstName, v.lastName].filter(Boolean).join(" ") ||
        v.username ||
        v.id,
      username: v.username,
      type: "VENDOR",
    }));

    const club = Array.isArray(data.club) ? data.club : [];
    const clubAccounts = club.map((c: AccountRecord) => ({
      id: c.id,
      label: "Club",
      type: "CLUB",
    }));

    const accounts = [...clubAccounts, ...members, ...vendors];

    return NextResponse.json({ accounts, members, vendors });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: `Failed to fetch accounts: ${message}` },
      { status: 500 }
    );
  }
}
