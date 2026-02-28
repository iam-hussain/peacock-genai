import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { getChatHistoryForUI } from "../chat-history";

import { getPeacockApiUrl } from "@/lib/auth";
import { getClientIdentifier } from "@/lib/rate-limit";

/**
 * GET /api/chat/history
 * Returns chat history for the current user/session
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const sessionId = getClientIdentifier(req);
    let userId: string | null = null;
    const cookie = req.headers.get("cookie");

    if (cookie) {
      try {
        const authResponse = await fetch(`${getPeacockApiUrl()}/api/auth/me`, {
          headers: { Cookie: cookie },
        });
        if (authResponse.ok) {
          const authData = await authResponse.json();
          userId = authData.user?.id || null;
        }
      } catch {
        // Ignore auth fetch errors
      }
    }

    const messages = await getChatHistoryForUI(userId, sessionId);

    return NextResponse.json({ messages });
  } catch (error) {
    console.error("Chat history fetch error:", error);
    return NextResponse.json(
      { error: "Failed to load chat history" },
      { status: 500 }
    );
  }
}
