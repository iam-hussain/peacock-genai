"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { ChatHeader } from "@/components/organisms/chat-header";
import { cn } from "@/lib/utils";

const DEFAULT_PROMPT = "Create a transaction";

/**
 * Create Transaction page — redirects to chat with transaction-focused prompt.
 * Transaction creation is chat-based: describe what you want in natural language.
 */
export default function CreateTransactionPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace(`/chat?prompt=${encodeURIComponent(DEFAULT_PROMPT)}`);
  }, [router]);

  return (
    <div
      className={cn(
        "flex min-h-d-screen flex-col",
        "bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20"
      )}
    >
      <ChatHeader />
      <div className="flex flex-1 flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Opening chat to create transaction...
        </p>
      </div>
    </div>
  );
}
