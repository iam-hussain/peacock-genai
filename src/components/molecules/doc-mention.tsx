"use client";

import { cn } from "@/lib/utils";
import { DOC_MENTION_PROMPTS } from "@/utils/example-prompts";

interface DocMentionProps {
  onSelect: (prompt: string) => void;
  disabled?: boolean;
  className?: string;
}

/**
 * DocMention - Clickable example prompt chips for the chat
 * Helps users discover what they can ask the AI
 */
export function DocMention({ onSelect, disabled, className }: DocMentionProps) {
  return (
    <div
      className={cn(
        "flex overflow-x-auto flex-nowrap gap-2 pb-2 sm:flex-wrap sm:justify-center sm:overflow-visible sm:pb-0 -mx-3 px-3 sm:mx-0 sm:px-0",
        className
      )}
      role="list"
      aria-label="Example prompts"
    >
      {DOC_MENTION_PROMPTS.map((prompt) => (
        <button
          key={prompt}
          type="button"
          onClick={() => onSelect(prompt)}
          disabled={disabled}
          className={cn(
            "rounded-full border border-border bg-card px-4 py-2 text-sm text-card-foreground shrink-0",
            "transition-colors hover:bg-accent hover:text-accent-foreground hover:scale-105 focus-visible:scale-105",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50"
          )}
          role="listitem"
        >
          {prompt}
        </button>
      ))}
    </div>
  );
}
