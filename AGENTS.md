# Peacock GenAI — Context for AI Coding Assistants

This document provides context for AI coding assistants working on this codebase.

## Tech Stack

- **Framework**: Next.js 15+ (App Router)
- **Language**: TypeScript (strict mode)
- **UI**: React 18, Tailwind CSS, shadcn/ui
- **AI**: LangChain, LangGraph, OpenAI
- **Database**: Prisma + MongoDB (Prisma v7 / Rust-free ready)
- **Deployment**: Vercel (Edge/Serverless)

## Project Structure

```
peacock-genai/
├── prisma/                    # Database schema & migrations
├── public/                    # Static assets (fonts, svg, etc.)
├── scripts/                   # Data seeding & AI fine-tuning scripts
├── src/
│   ├── app/                   # ROUTING LAYER (Keep lean)
│   │   ├── (auth)/            # Route group for Login/Register
│   │   ├── (app)/             # Route group for the main product
│   │   │   ├── chat/          # chat.peacock.ai/chat
│   │   │   └── agents/        # Agent management dashboard
│   │   ├── api/               # API Route Handlers (Edge/Serverless)
│   │   │   ├── chat/          # Vercel AI SDK streaming endpoints
│   │   │   └── agents/        # Agent orchestration logic
│   │   └── layout.tsx         # Root layout with Providers
│   ├── components/            # UI LAYER (Atomic Design)
│   │   ├── molecules/         # Compound units (ChatInput, ApiErrorBanner, ThemeToggle)
│   │   ├── organisms/         # Complex sections (ChatHeader, ChatMessage)
│   │   └── ui/                # shadcn/ui primitives
│   ├── core/                  # INTELLIGENCE LAYER (The Brain)
│   │   ├── agents/            # LangChain/LangGraph Agent definitions
│   │   │   ├── base-agent.ts  # LangGraph agent
│   │   │   └── agent-config.ts
│   │   ├── tools/             # Agent tools (transaction, etc.)
│   │   │   ├── transaction-tool.ts
│   │   │   └── index.ts       # Central Tool Registry
│   │   └── prompts/           # System instructions & templates
│   ├── features/              # BUSINESS LOGIC (Hooks + State)
│   │   └── chat/              # useChat history, stream management
│   ├── lib/                   # SDK Configs (prisma, openai, supabase)
│   ├── types/                 # Global TS interfaces
│   └── utils/                 # Pure helper functions (cn, formatDate)
```

## Conventions

- **Path alias**: `@/` maps to `src/`
- **Styling**: Tailwind + shadcn tokens only (no `dark:` utilities; use CSS variables)
- **Exports**: Named exports preferred; React components in PascalCase
- **Formatting**: 2 spaces, single quotes, no semicolons

## Key Files

- `src/core/agents/base-agent.ts` — LangGraph agent definition
- `src/core/tools/index.ts` — Central tool registry
- `src/core/prompts/index.ts` — System prompts
- `src/app/api/chat/route.ts` — Chat API endpoint
- `src/lib/db.ts` — Prisma client singleton

## Environment

See `.env.example` for required variables (OpenAI, Peacock API URL, DATABASE_URL, etc.).
