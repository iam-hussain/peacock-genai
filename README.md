# Peacock GenAI

Next.js application with LangChain agent integration using OpenAI for Peacock Club financial management.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env.local` file and add your configuration:
```env
# OpenAI Configuration
OPENAI_API_KEY=your_actual_api_key_here
OPENAI_MODEL=gpt-4o-mini
OPENAI_TEMPERATURE=0.1
AGENT_MAX_TOKENS=1000
AGENT_TIMEOUT=30

# Peacock API Configuration
PEACOCK_API_URL=https://peacock.iam-hussain.site
PEACOCK_ADMIN_USERNAME=admin
PEACOCK_ADMIN_PASSWORD=peacock
```

**Configuration Options:**
- `OPENAI_API_KEY`: Your OpenAI API key (required)
- `OPENAI_MODEL`: Model to use (default: gpt-4o-mini)
- `OPENAI_TEMPERATURE`: Controls randomness (0.0-2.0, default: 0.1)
- `AGENT_MAX_TOKENS`: Maximum tokens in response (1-100000, default: 1000)
- `AGENT_TIMEOUT`: Request timeout in seconds (1-300, default: 30)
- `PEACOCK_API_URL`: Base URL for Peacock API
- `PEACOCK_ADMIN_USERNAME`: Admin username for API access
- `PEACOCK_ADMIN_PASSWORD`: Admin password for API access

3. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## API Endpoints

### Health Check
```
GET /api/health
```

### Agent Chat
```
POST /api/agent
Content-Type: application/json

{
  "messageId": "msg-123",
  "type": "text",
  "content": "What is 25 * 4?",
  "sender": "user",
  "receiver": "assistant",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "status": "sent",
  "error": null
}
```

## Project Structure

```
app/
├── api/
│   ├── agent/
│   │   └── route.ts      # Agent chat API route
│   └── health/
│       └── route.ts      # Health check API route
├── layout.tsx            # Root layout
├── page.tsx              # Main chat page
└── globals.css           # Global styles

components/
├── chat-header.tsx        # Chat header component
├── chat-input.tsx         # Chat input component
└── chat-message.tsx       # Chat message component

src/
├── agents/                # LangChain agent setup
│   ├── factory/          # Agent factory
│   ├── managers/         # Agent manager
│   ├── prompts/          # System prompts
│   └── tools/            # Agent tools
├── config/               # Configuration
├── utils/                # Utilities (logger, API client)
├── types/                # TypeScript types
└── data/                 # Static data (swagger, base-info)
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

