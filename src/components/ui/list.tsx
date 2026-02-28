import * as React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { cn } from "@/lib/utils";
import { type ListData } from "@/types";

/** Renders inline markdown (bold, italic, code) within list items */
function InlineMarkdown({ children }: { children: string }) {
  const content =
    typeof children === "string" ? children : String(children ?? "");
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ children }) => <>{children}</>,
        ul: ({ children }) => <>{children}</>,
        ol: ({ children }) => <>{children}</>,
        li: ({ children }) => <>{children}</>,
        strong: ({ children }) => (
          <strong className="font-semibold">{children}</strong>
        ),
        em: ({ children }) => <em>{children}</em>,
        code: ({ children }) => (
          <code className="rounded bg-muted px-1 py-0.5 text-xs">
            {children}
          </code>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

const DEFAULT_MAX_ITEMS = 20;

interface ListProps {
  data: ListData;
  className?: string;
  /** Max items to show before "Show N more" expansion. Set to 0 for no limit. */
  maxItems?: number;
}

/**
 * Check if item is a member list entry with loan balance (format: "Name - Status, Loan Balance: X")
 */
function isMemberListItemWithBalance(item: string): boolean {
  return /^.+?\s-\s(Active|Inactive),\sLoan Balance:\s/.test(item);
}

/**
 * Check if item is a simple member list entry (format: "Name - Status")
 */
function isSimpleMemberListItem(item: string): boolean {
  return /^.+?\s-\s(Active|Inactive)$/.test(item);
}

/**
 * Parse member list item with loan balance into structured data
 */
function parseMemberItemWithBalance(
  item: string
): { name: string; status: "Active" | "Inactive"; loanBalance: string } | null {
  const match = item.match(
    /^(.+?)\s-\s(Active|Inactive),\sLoan Balance:\s(.+)$/
  );
  if (!match) return null;

  return {
    name: match[1]?.trim() ?? "",
    status: match[2] as "Active" | "Inactive",
    loanBalance: match[3]?.trim() ?? "",
  };
}

/**
 * Parse simple member list item (name and status only)
 */
function parseSimpleMemberItem(
  item: string
): { name: string; status: "Active" | "Inactive" } | null {
  const match = item.match(/^(.+?)\s-\s(Active|Inactive)$/);
  if (!match) return null;

  return {
    name: match[1]?.trim() ?? "",
    status: match[2] as "Active" | "Inactive",
  };
}

export function List({
  data,
  className,
  maxItems = DEFAULT_MAX_ITEMS,
}: ListProps): JSX.Element {
  const [expanded, setExpanded] = React.useState(false);

  // Check if this is a member list with loan balances
  const isMemberListWithBalance =
    data.items.length > 0 && isMemberListItemWithBalance(data.items[0]!);

  // Check if this is a simple member list (name and status only)
  const isSimpleMemberList =
    data.items.length > 0 && isSimpleMemberListItem(data.items[0]!);

  if (isMemberListWithBalance) {
    const members = data.items
      .map(parseMemberItemWithBalance)
      .filter(
        (m): m is NonNullable<ReturnType<typeof parseMemberItemWithBalance>> =>
          m !== null
      );

    const showMoreCount = maxItems > 0 ? members.length - maxItems : 0;
    const displayMembers =
      maxItems > 0 && members.length > maxItems
        ? members.slice(0, maxItems)
        : members;
    const visibleMembers = expanded ? members : displayMembers;

    return (
      <div className={cn("space-y-3", className)}>
        {data.title && (
          <h3 className="text-base font-semibold text-foreground mb-2">
            {data.title}
          </h3>
        )}
        {members.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No members found
          </p>
        ) : (
          <>
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {visibleMembers.map((member, index) => (
                <div
                  key={index}
                  className={cn(
                    "flex items-center justify-between gap-4 p-3 rounded-lg border transition-colors",
                    member.status === "Active"
                      ? "bg-primary/5 border-primary/20 hover:bg-primary/10"
                      : "bg-muted/30 border-border hover:bg-muted/50"
                  )}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div
                      className={cn(
                        "h-2 w-2 rounded-full shrink-0",
                        member.status === "Active"
                          ? "bg-primary"
                          : "bg-muted-foreground"
                      )}
                    />
                    <span className="font-medium text-foreground truncate">
                      {member.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <span
                      className={cn(
                        "px-2 py-1 rounded text-xs font-medium",
                        member.status === "Active"
                          ? "bg-primary/30 text-primary-foreground"
                          : "bg-muted/80 text-muted-foreground"
                      )}
                    >
                      {member.status}
                    </span>
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">
                        Loan Balance
                      </div>
                      <div className="text-sm font-semibold text-foreground">
                        ₹{member.loanBalance}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {showMoreCount > 0 && !expanded && (
              <button
                type="button"
                onClick={() => setExpanded(true)}
                className="text-sm text-primary hover:underline font-medium"
              >
                Show {showMoreCount} more
              </button>
            )}
          </>
        )}
      </div>
    );
  }

  if (isSimpleMemberList) {
    const members = data.items
      .map(parseSimpleMemberItem)
      .filter(
        (m): m is NonNullable<ReturnType<typeof parseSimpleMemberItem>> =>
          m !== null
      );

    const showMoreCount = maxItems > 0 ? members.length - maxItems : 0;
    const displayMembers =
      maxItems > 0 && members.length > maxItems
        ? members.slice(0, maxItems)
        : members;
    const visibleMembers = expanded ? members : displayMembers;

    // Compact view for simple member lists (no loan balances)
    return (
      <div className={cn("space-y-2", className)}>
        {data.title && (
          <h3 className="text-sm font-semibold text-foreground mb-2">
            {data.title}
          </h3>
        )}
        {members.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No members found
          </p>
        ) : (
          <>
            <div className="max-h-[500px] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {visibleMembers.map((member, index) => (
                  <div
                    key={index}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-md border transition-colors",
                      member.status === "Active"
                        ? "bg-primary/5 border-primary/20 hover:bg-primary/10"
                        : "bg-muted/20 border-border hover:bg-muted/40"
                    )}
                  >
                    <div
                      className={cn(
                        "h-1.5 w-1.5 rounded-full shrink-0",
                        member.status === "Active"
                          ? "bg-primary"
                          : "bg-muted-foreground"
                      )}
                    />
                    <span className="text-sm font-medium text-foreground truncate flex-1">
                      {member.name}
                    </span>
                    <span
                      className={cn(
                        "px-1.5 py-0.5 rounded text-xs font-medium shrink-0",
                        member.status === "Active"
                          ? "bg-primary/30 text-primary-foreground"
                          : "bg-muted/80 text-muted-foreground"
                      )}
                    >
                      {member.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            {showMoreCount > 0 && !expanded && (
              <button
                type="button"
                onClick={() => setExpanded(true)}
                className="text-sm text-primary hover:underline font-medium"
              >
                Show {showMoreCount} more
              </button>
            )}
          </>
        )}
      </div>
    );
  }

  // Regular list rendering
  const ListComponent = data.ordered ? "ol" : "ul";
  const listStyle = data.ordered
    ? "list-decimal list-inside"
    : "list-disc list-inside";

  const showMoreCount = maxItems > 0 ? data.items.length - maxItems : 0;
  const displayItems =
    maxItems > 0 && data.items.length > maxItems
      ? data.items.slice(0, maxItems)
      : data.items;
  const visibleItems = expanded ? data.items : displayItems;

  return (
    <div className={cn("space-y-2", className)}>
      {data.title && (
        <h3 className="text-sm font-semibold text-foreground">{data.title}</h3>
      )}
      {data.items.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">
          No items found
        </p>
      ) : (
        <>
          <ListComponent
            className={cn("space-y-2 text-sm text-foreground", listStyle)}
          >
            {visibleItems.map((item, index) => (
              <li key={index} className="pl-2 py-1 [&>p]:inline [&>p]:m-0">
                <InlineMarkdown>{String(item)}</InlineMarkdown>
              </li>
            ))}
          </ListComponent>
          {showMoreCount > 0 && !expanded && (
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="text-sm text-primary hover:underline font-medium"
            >
              Show {showMoreCount} more
            </button>
          )}
        </>
      )}
    </div>
  );
}
