import * as React from "react";

import { cn } from "@/lib/utils";
import { type CardData } from "@/types";

interface CardProps {
  data: CardData;
  className?: string;
}

export function Card({ data, className }: CardProps): JSX.Element {
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card p-4 shadow-sm",
        className
      )}
    >
      <h3 className="mb-2 text-base font-semibold text-card-foreground">
        {data.title}
      </h3>
      {data.description && (
        <p className="mb-3 text-sm text-muted-foreground">{data.description}</p>
      )}
      {data.items && data.items.length > 0 && (
        <div className="space-y-2">
          {data.items.map((item, index) => (
            <div
              key={index}
              className="flex justify-between border-b border-border/50 pb-2 last:border-0"
            >
              <span className="text-sm font-medium text-muted-foreground">
                {item.label}
              </span>
              <span className="text-sm text-card-foreground">{item.value}</span>
            </div>
          ))}
        </div>
      )}
      {data.footer && (
        <p className="mt-3 text-xs text-muted-foreground">{data.footer}</p>
      )}
    </div>
  );
}
