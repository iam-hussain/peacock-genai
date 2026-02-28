"use client";

import { ArrowLeft, BookOpen, MessageCircle, Plus, Send } from "lucide-react";
import Link from "next/link";

import { ChatHeader } from "@/components/organisms/chat-header";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { EXAMPLE_PROMPT_CATEGORIES } from "@/utils/example-prompts";

export default function PromptsPage() {
  return (
    <div
      className={cn(
        "flex min-h-d-screen flex-col",
        "bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20"
      )}
    >
      <ChatHeader />
      <div
        className={cn(
          "mx-auto max-w-4xl flex-1 px-4 py-8",
          "bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10"
        )}
      >
        <Link
          href="/chat"
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Chat
        </Link>
        <div className="mb-8">
          <h1 className="flex items-center gap-2 text-2xl font-semibold text-foreground">
            <BookOpen className="h-7 w-7" />
            Example Prompts & How to Use
          </h1>
          <p className="mt-2 text-muted-foreground">
            Learn what you can ask the Peacock AI chatbot and how to get the
            best results.
          </p>
        </div>

        <section className="mb-10">
          <h2 className="mb-4 text-lg font-semibold text-foreground">
            How to Use the Chatbot
          </h2>
          <div className="space-y-3 rounded-lg border border-border bg-card p-6 text-card-foreground">
            <p className="text-sm">
              The Peacock AI uses specialized agents to answer your questions
              about members, loans, and finances. Simply type your question in
              natural language—no special syntax required.
            </p>
            <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
              <li>
                <strong className="text-foreground">Be specific</strong> — e.g.
                &quot;Show members who joined after September 2025&quot;
              </li>
              <li>
                <strong className="text-foreground">Use keywords</strong> — The
                AI routes to the right agent based on terms like
                &quot;loans&quot;, &quot;transactions&quot;, &quot;members&quot;
              </li>
              <li>
                <strong className="text-foreground">Transactions</strong> — You
                can create or execute transactions directly through the chat
              </li>
            </ul>
            <div className="mt-4 flex gap-2">
              <Link href="/chat">
                <Button size="sm">
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Open Chat
                </Button>
              </Link>
              <Link href="/transactions/create">
                <Button variant="outline" size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Transaction
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 text-lg font-semibold text-foreground">
            Creating Transactions
          </h2>
          <div className="space-y-4 rounded-lg border border-border bg-card p-6 text-card-foreground">
            <p className="text-sm">
              You can create one or multiple transactions in natural language.
              The AI will look up account IDs from member names and execute the
              transactions.
            </p>

            <div>
              <h4 className="mb-2 text-sm font-medium text-foreground">
                Transaction types
              </h4>
              <p className="mb-2 text-xs text-muted-foreground">
                DEPOSIT, WITHDRAWAL, LOAN, LOAN_REPAYMENT, INTEREST, FEE,
                TRANSFER
              </p>
            </div>

            <div>
              <h4 className="mb-2 text-sm font-medium text-foreground">
                Single transaction examples
              </h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>
                  &quot;Create a deposit of 5000 from Club account to member
                  Sampath&quot;
                </li>
                <li>
                  &quot;Record a loan repayment of 2000 from Kirubakaran to
                  Club&quot;
                </li>
                <li>
                  &quot;Execute a withdrawal of 1000 from member Kamalesh&quot;
                </li>
              </ul>
            </div>

            <div>
              <h4 className="mb-2 text-sm font-medium text-foreground">
                Multiple transactions examples
              </h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>
                  &quot;Add 3 deposits: 1000 from Sampath, 500 from Kirubakaran,
                  2000 from Kamalesh&quot;
                </li>
                <li>
                  &quot;Create loan repayments: 1500 from member A, 2000 from
                  member B&quot;
                </li>
                <li>
                  &quot;Record monthly deposits for all active members&quot;
                </li>
              </ul>
            </div>

            <p className="text-xs text-muted-foreground">
              Tip: Ask &quot;Show me all members&quot; first to get account IDs,
              or use member names—the AI will resolve them.
            </p>
          </div>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 text-lg font-semibold text-foreground">
            Member Full Details
          </h2>
          <div className="space-y-3 rounded-lg border border-border bg-card p-6 text-card-foreground">
            <p className="text-sm">
              For &quot;full loan details of cibi&quot;, &quot;give me all
              details of X&quot;, or &quot;full profile of [username]&quot; —
              the AI uses
              <code className="mx-1 rounded bg-muted px-1.5 py-0.5 text-xs">
                POST /api/account/member/[username]
              </code>
              and returns all fields: id, username, name, phone, clubHeldAmount,
              loanHistory, interestBalance, currentLoanTaken, and more.
            </p>
          </div>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 text-lg font-semibold text-foreground">
            Club Held Money
          </h2>
          <div className="space-y-3 rounded-lg border border-border bg-card p-6 text-card-foreground">
            <p className="text-sm">
              <strong className="text-foreground">clubHeldAmount</strong> is
              money in rupees (₹) that belongs to the club and members keep
              safe. Data comes from each member&apos;s profile.
            </p>
            <p className="text-sm text-muted-foreground">
              Example: &quot;Who are holding club money?&quot; — Returns members
              with clubHeldAmount &gt; 0, formatted as a table with Name,
              Username, and Amount.
            </p>
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-lg font-semibold text-foreground">
            Example Prompts by Category
          </h2>
          <div className="space-y-6">
            {EXAMPLE_PROMPT_CATEGORIES.map((category) => (
              <div
                key={category.id}
                className="rounded-lg border border-border bg-card p-6 shadow-sm"
              >
                <h3 className="text-base font-semibold text-card-foreground">
                  {category.title}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {category.description}
                </p>
                <ul className="mt-4 space-y-2">
                  {category.prompts.map((prompt) => (
                    <li
                      key={prompt}
                      className="flex items-center justify-between gap-3 rounded-md border border-border/50 bg-background/50 px-4 py-2 text-sm text-foreground"
                    >
                      <span>&quot;{prompt}&quot;</span>
                      <Button
                        variant="secondary"
                        size="sm"
                        asChild
                        className="shrink-0"
                      >
                        <Link
                          href={`/chat?prompt=${encodeURIComponent(prompt)}`}
                          className="inline-flex items-center gap-1.5"
                        >
                          <Send className="h-3.5 w-3.5" />
                          Try
                        </Link>
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
