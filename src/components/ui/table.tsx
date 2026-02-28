import * as React from "react";

import { cn } from "@/lib/utils";
import { type TableData } from "@/types";

interface TableProps {
  data: TableData;
  className?: string;
  /** When true, renders as card layout on screens below sm breakpoint */
  responsive?: boolean;
}

const TABLE_MAX_HEIGHT = "max-h-[420px]";

function isNumericOrCurrency(
  value: string | number | null | undefined
): boolean {
  if (value == null) return false;
  if (typeof value === "number") return true;
  const s = String(value);
  return /^[₹$€]|[\d,]+/.test(s);
}

export function Table({
  data,
  className,
  responsive = true,
}: TableProps): JSX.Element {
  const headers = data?.headers ?? [];
  const rows = data?.rows ?? [];

  if (headers.length === 0 && rows.length === 0) {
    return (
      <div
        className={cn(
          "rounded-xl border border-border bg-card p-4 text-center text-sm text-muted-foreground",
          className
        )}
      >
        No data to display
      </div>
    );
  }

  return (
    <div
      className={cn(
        "w-full overflow-x-auto overflow-y-auto rounded-xl border border-border bg-card shadow-sm",
        TABLE_MAX_HEIGHT,
        className
      )}
    >
      {data?.caption && (
        <div className="sticky top-0 z-20 border-b border-border bg-card px-4 py-3">
          <p className="text-sm font-semibold text-foreground">
            {data.caption}
          </p>
        </div>
      )}
      {/* Card layout for mobile (below sm) */}
      {responsive && (
        <div className="space-y-3 p-3 sm:hidden">
          {rows.map((row, rowIndex) => (
            <div
              key={rowIndex}
              className={cn(
                "rounded-lg border border-border bg-background/50 p-4 shadow-sm transition-colors hover:bg-muted/30",
                rowIndex % 2 === 1 && "bg-muted/20"
              )}
            >
              <div className="space-y-3">
                {row.map((cell, cellIndex) => (
                  <div
                    key={cellIndex}
                    className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      {headers[cellIndex] ?? `Column ${cellIndex + 1}`}
                    </span>
                    <span
                      className={cn(
                        "text-sm font-variant-numeric tabular-nums",
                        isNumericOrCurrency(cell)
                          ? "font-semibold text-foreground"
                          : "text-foreground"
                      )}
                    >
                      {cell ?? "—"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      {/* Table layout for sm and up */}
      <div className="hidden sm:block">
        <table
          className={cn(
            "w-full table-auto border-collapse",
            responsive && "sm:table"
          )}
        >
          <thead className="sticky top-0 z-10 bg-muted/95 backdrop-blur supports-[backdrop-filter]:bg-muted/90">
            <tr>
              {headers.map((header, index) => (
                <th
                  key={index}
                  className="whitespace-nowrap border-b-2 border-border px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-foreground"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-background">
            {rows.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className={cn(
                  "transition-colors hover:bg-muted/40",
                  rowIndex % 2 === 1 && "bg-muted/20"
                )}
              >
                {row.map((cell, cellIndex) => (
                  <td
                    key={cellIndex}
                    className={cn(
                      "whitespace-nowrap px-4 py-3 text-sm font-variant-numeric tabular-nums",
                      isNumericOrCurrency(cell)
                        ? "font-medium text-foreground"
                        : "text-foreground"
                    )}
                  >
                    {cell ?? "—"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
