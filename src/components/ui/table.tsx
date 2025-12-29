import * as React from "react";

import { cn } from "@/lib/utils";
import { type TableData } from "@/types";

interface TableProps {
  data: TableData;
  className?: string;
}

export function Table({ data, className }: TableProps): JSX.Element {
  return (
    <div className={cn("overflow-x-auto", className)}>
      {data.caption && (
        <p className="mb-2 text-sm font-semibold text-foreground">
          {data.caption}
        </p>
      )}
      <table className="min-w-full divide-y divide-border border border-border rounded-lg">
        <thead className="bg-muted">
          <tr>
            {data.headers.map((header, index) => (
              <th
                key={index}
                className="px-4 py-3 text-left text-sm font-semibold text-foreground"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border bg-background">
          {data.rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="hover:bg-muted/50 transition-colors">
              {row.map((cell, cellIndex) => (
                <td
                  key={cellIndex}
                  className="px-4 py-3 text-sm text-foreground"
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
