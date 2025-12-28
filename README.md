# Peacock GenAI

Express server with LangChain agent integration using OpenAI.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Install dependencies:
```bash
npm install
```

3. Set up Prisma:
```bash
npm run prisma:generate
```

4. Create a `.env` file and add your configuration:
```env
# Database
DATABASE_URL="mongodb://localhost:27017/peacock-genai"

# OpenAI Configuration
OPENAI_API_KEY=your_actual_api_key_here
OPENAI_MODEL=gpt-4o-mini
OPENAI_TEMPERATURE=0.1
AGENT_MAX_TOKENS=1000
AGENT_TIMEOUT=30
```

**Configuration Options:**
- `DATABASE_URL`: MongoDB connection string (required)
- `OPENAI_TEMPERATURE`: Controls randomness (0.0-2.0, default: 0.1)
- `AGENT_MAX_TOKENS`: Maximum tokens in response (1-100000, default: 1000)
- `AGENT_TIMEOUT`: Request timeout in seconds (1-300, default: 30)

4. Run the development server:
```bash
npm run dev
```

## API Endpoints

### Health Check
```
GET /health
```

### Agent Chat
```
POST /api/agent
Content-Type: application/json

{
  "message": "What is 25 * 4?"
}
```

## Project Structure

```
src/
├── server.ts              # Entry point
├── app.ts                 # Express app setup
├── config/
│   └── agent.ts          # Agent configuration
├── agents/
│   ├── setup.ts          # Agent initialization
│   └── tools/
│       ├── calculator.ts # Example tool
│       └── index.ts      # Tool exports
├── routes/
│   ├── health.ts         # Health check route
│   ├── api.ts            # API routes
│   └── agent.ts          # Agent chat route
├── middleware/
│   └── error-handler.ts  # Error handling
├── lib/
│   ├── logger.ts         # Logging utility
│   └── prisma.ts         # Prisma client singleton
├── types/
│   └── index.ts          # TypeScript types
└── prisma/
    └── schema.prisma     # Prisma schema (MongoDB)
```

## Best Practices Implemented

### Configuration
- **Centralized config**: All agent settings in `src/config/agent.ts`
- **Type-safe validation**: Zod schemas for environment variables
- **Clear error messages**: Helpful errors for missing/invalid config
- **Sensible defaults**: Optional values have defaults

### Agent Setup
- **Lazy initialization**: Agent created only when needed
- **Singleton pattern**: Reuses same agent instance
- **Clear system prompt**: Defines agent behavior
- **Configurable**: Model, temperature via environment variables

### Tools
- **Type-safe tools**: DynamicStructuredTool with Zod schemas
- **Clear descriptions**: Help agent understand when to use tools
- **Error handling**: Tools handle edge cases (e.g., division by zero)
- **Modular**: Easy to add new tools

### Code Organization
- **Separation of concerns**: Config, setup, tools, routes separated
- **Reusable**: Easy to extend with new tools and routes
- **Type-safe**: Full TypeScript support
- **Error handling**: Proper error middleware integration

