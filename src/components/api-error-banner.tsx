"use client";

import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ApiError {
  id: string;
  message: string;
  timestamp: Date;
  endpoint?: string;
}

interface ApiErrorBannerProps {
  error: ApiError | null;
  onClear: () => void;
}

export function ApiErrorBanner({
  error,
  onClear,
}: ApiErrorBannerProps): JSX.Element | null {
  if (!error) return null;

  return (
    <div className="border-b border-destructive/20 bg-destructive/10 px-4 py-3">
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-destructive">
              API Error
            </span>
            {error.endpoint && (
              <span className="text-xs text-muted-foreground">
                ({error.endpoint})
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-destructive">{error.message}</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClear}
          className={cn(
            "h-8 w-8 shrink-0 text-destructive hover:bg-destructive/20"
          )}
          aria-label="Clear error"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
