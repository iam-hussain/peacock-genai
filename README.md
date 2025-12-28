# Peacock GenAI

Express server with LangChain agent integration using OpenAI.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

3. Add your OpenAI API key to `.env`:
```
OPENAI_API_KEY=your_actual_api_key_here
```

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
│   └── logger.ts         # Logging utility
└── types/
    └── index.ts          # TypeScript types
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

