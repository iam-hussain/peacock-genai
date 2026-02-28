import { NextResponse } from "next/server";

import { clearCache } from "@/utils/api-cache";

/**
 * Clear API response cache and session token
 * POST /api/agents/clear
 */
export async function POST(): Promise<NextResponse> {
  try {
    clearCache();

    const { clearSessionToken } = await import("@/utils/api-client");
    clearSessionToken();

    return NextResponse.json({
      success: true,
      message: "Cache and session token cleared successfully",
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to clear cache";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
