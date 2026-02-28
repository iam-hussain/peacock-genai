import { type NextRequest, NextResponse } from "next/server";

import { peacockFetch } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TRANSACTION_TYPES = [
  "DEPOSIT",
  "WITHDRAWAL",
  "LOAN",
  "LOAN_REPAYMENT",
  "INTEREST",
  "FEE",
  "TRANSFER",
] as const;

const createTransactionSchema = {
  fromId: (v: unknown) => typeof v === "string" && v.length > 0,
  toId: (v: unknown) => typeof v === "string" && v.length > 0,
  amount: (v: unknown) => typeof v === "number" && v > 0,
  transactionType: (v: unknown) =>
    typeof v === "string" &&
    TRANSACTION_TYPES.includes(v as (typeof TRANSACTION_TYPES)[number]),
};

/**
 * POST /api/transaction/create
 * Creates a transaction via Peacock API
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (
      !createTransactionSchema.fromId(body.fromId) ||
      !createTransactionSchema.toId(body.toId) ||
      !createTransactionSchema.amount(body.amount) ||
      !createTransactionSchema.transactionType(body.transactionType)
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid request. Required: fromId, toId (strings), amount (positive number), transactionType (DEPOSIT, WITHDRAWAL, LOAN, LOAN_REPAYMENT, INTEREST, FEE, TRANSFER)",
        },
        { status: 400 }
      );
    }

    const payload = {
      fromId: body.fromId,
      toId: body.toId,
      amount: Number(body.amount),
      transactionType: body.transactionType,
      description:
        typeof body.description === "string" ? body.description : undefined,
      occurredAt:
        typeof body.occurredAt === "string" ? body.occurredAt : undefined,
    };

    const response = await peacockFetch("/api/transaction/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage =
        errorData.error || errorData.message || (await response.text());
      return NextResponse.json(
        { error: errorMessage || `API error ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: `Failed to create transaction: ${message}` },
      { status: 500 }
    );
  }
}
