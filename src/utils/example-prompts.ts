/**
 * Example prompts for the Peacock AI chatbot
 * All prompts request comprehensive, detailed output
 */

export interface ExamplePromptCategory {
  id: string;
  title: string;
  description: string;
  prompts: string[];
}

export const EXAMPLE_PROMPT_CATEGORIES: ExamplePromptCategory[] = [
  {
    id: "directory",
    title: "Members & Directory",
    description:
      "Members, vendors, profiles, club money holders (clubHeldAmount—₹ members keep safe for the club)",
    prompts: [
      "Who are holding club money?",
      "Give me full loan details of cibi",
      "Give me all details of cibi",
      "Show me all members with their name, username, phone, status, and join date",
      "Get full profile for member Sampath with all loan and club data",
    ],
  },
  {
    id: "lending",
    title: "Loans & Lending",
    description:
      "Loan registry with name, amount, interest, dates, and repayment history",
    prompts: [
      "Who has active loans? Show member name, loan amount pending, taken at date, interest balance, and repayment history for each",
      "Show the full loan registry with all details: name, pending amount, interest, dates taken, and balance",
      "What's the interest balance and loan statement for member Sampath? Include all transactions",
      "Show loan repayment history for all members with amounts and dates",
      "List all closed loans with final amounts and closure details",
    ],
  },
  {
    id: "finance",
    title: "Finance & Transactions",
    description:
      "Transactions, create single or multiple, dashboard, analytics",
    prompts: [
      "Create a deposit of 5000 from Club to member Sampath",
      "Record a loan repayment of 2000 from Kirubakaran to Club",
      "Add 3 deposits: 1000 from Sampath, 500 from Kirubakaran, 2000 from Kamalesh",
      "Show recent transactions with date, amount, type, from/to, and description",
      "Give me the dashboard summary: available cash, total portfolio value, current loans, interest balance",
    ],
  },
];

/** DocMention chips - prompts that request comprehensive output */
export const DOC_MENTION_PROMPTS: string[] = [
  "Who are holding club money?",
  "Give me full loan details of cibi",
  "Give me all details of cibi",
  "Who has active loans? Show member name, loan amount pending, taken at, interest, and balance for each",
  "Dashboard summary: available cash, portfolio value, loans, interest",
];
