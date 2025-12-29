# Agents Module

Simple and clean architecture for managing LangChain agents with automatic caching.

## Structure

```
agents/
├── index.ts              # Main entry point - exports all public APIs
├── types/                 # TypeScript type definitions
│   └── index.ts
├── prompts/               # System prompts and context generators
│   ├── club-agent.prompt.ts
│   └── context-generator.ts
├── factory/               # Agent factory for creating agents
│   └── agent-factory.ts
├── managers/              # Agent manager - singleton with caching
│   └── agent-manager.ts
├── middleware/            # Agent middleware
│   └── guardrail.ts
└── tools/                 # Agent tools
    ├── index.ts
    ├── member-tools.ts
    └── transaction-tools.ts
```

## Usage

### Basic Usage

The agent is created once and automatically cached for all future requests:

```typescript
import { agentManager } from './agents'

// Get the agent (created once, then cached)
const agent = await agentManager.getAgent()

// Use the agent
const result = await agent.invoke({
  messages: [new HumanMessage('Hello')],
})
```

### Initialization at Startup

Initialize the agent at server startup for better performance:

```typescript
import { agentManager } from './agents'

// In your server startup code
await agentManager.initialize()
console.log('Agent ready')
```

### Direct Factory Usage (Not Recommended)

You can create agents directly, but they won't be cached:

```typescript
import { createAgentInstance } from './agents'

// Creates a new agent instance (not cached)
const agent = await createAgentInstance()
```

**Note:** Always use `agentManager.getAgent()` instead to benefit from caching.

## How Caching Works

The agent manager uses a singleton pattern with lazy initialization:

1. **First call**: Agent is created and cached
2. **Subsequent calls**: Cached agent is returned immediately
3. **Thread-safe**: Multiple simultaneous calls wait for the same initialization

```typescript
// First API call
const agent1 = await agentManager.getAgent() // Creates agent

// Second API call (same request or different)
const agent2 = await agentManager.getAgent() // Returns cached agent

// agent1 === agent2 (same instance)
```

## Configuration

Agent configuration is managed in `src/config/agent.ts`:

```typescript
{
  model: 'gpt-4o-mini',
  temperature: 0.1,
  maxTokens: 1000,
  timeout: 30, // seconds
  apiKey: process.env.OPENAI_API_KEY,
}
```

## Middleware

### Guardrail Middleware

Automatically filters out non-club related questions. Applied by default to all agents.

The guardrail blocks:
- General greetings (hi, hello, etc.)
- Off-topic questions
- General knowledge questions

And allows:
- Club operations questions
- Member-related questions
- Loan-related questions
- Vendor-related questions
- Transaction-related questions

## Architecture

### Agent Manager (`managers/agent-manager.ts`)

Simple singleton that:
- Creates agent once on first call
- Caches agent instance
- Prevents duplicate creation (thread-safe)
- Provides `initialize()` for startup

### Agent Factory (`factory/agent-factory.ts`)

Creates LangChain agents with:
- Configuration from `config/agent.ts`
- System prompt from `prompts/club-agent.prompt.ts`
- Guardrail middleware applied automatically

## Best Practices

1. **Always use `agentManager.getAgent()`** - Benefits from caching
2. **Initialize at startup** - Call `agentManager.initialize()` in server startup
3. **Don't create agents directly** - Use the manager for caching
4. **Keep prompts separate** - Maintain prompts in `prompts/` folder
5. **Middleware is automatic** - Guardrail is applied by default

## Example: API Handler

```typescript
import { agentManager } from '../../agents'
import { HumanMessage } from '@langchain/core/messages'

export async function handleAgentChat(req, res) {
  // Get cached agent (created once, reused for all requests)
  const agent = await agentManager.getAgent()
  
  // Use agent
  const result = await agent.invoke({
    messages: [new HumanMessage(req.body.content)],
  })
  
  res.json(result)
}
```

