"use client";

import { Check, RefreshCw } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

import { Button } from "./ui/button";
import { ThemeToggle } from "./theme-toggle";

import { cn } from "@/lib/utils";

export function ChatHeader() {
  const [isClearing, setIsClearing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleClearCache = async (): Promise<void> => {
    setIsClearing(true);
    setShowSuccess(false);

    try {
      const response = await fetch("/api/cache/clear", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to clear cache");
      }

      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
      }, 2000);
    } catch (error) {
      console.error("Error clearing cache:", error);
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <Image
            src="/peacock.svg"
            alt="Peacock"
            width={32}
            height={32}
            className="h-8 w-8"
            priority
          />
          <h1 className="text-xl font-semibold">Peacock AI</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClearCache}
            disabled={isClearing}
            className={cn("h-9 w-9", showSuccess && "text-success")}
            aria-label="Clear API cache"
            title="Clear API cache"
          >
            {showSuccess ? (
              <Check className="h-4 w-4" />
            ) : (
              <RefreshCw
                className={cn("h-4 w-4", isClearing && "animate-spin")}
              />
            )}
          </Button>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
