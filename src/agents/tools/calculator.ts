import { tool } from 'langchain'
import { z } from 'zod'

/**
 * Calculator Tool
 * 
 * Best practices:
 * - Uses LangChain's tool function for type-safe tool definitions
 * - Zod schema for input validation
 * - Clear description helps agent understand when to use it
 * - Handles edge cases (division by zero)
 * - Returns structured results
 */
const calculatorSchema = z.object({
    operation: z.enum(['add', 'subtract', 'multiply', 'divide']),
    a: z.number(),
    b: z.number(),
})

type CalculatorInput = z.infer<typeof calculatorSchema>

// TypeScript has issues with deep type inference in LangChain tool types
// This is a known issue with LangChain v1.x and complex Zod schemas
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - Type instantiation is excessively deep (known LangChain/TypeScript issue)
export const calculatorTool = tool(
    async ({ operation, a, b }: CalculatorInput) => {
        let result: number

        switch (operation) {
            case 'add':
                result = a + b
                break
            case 'subtract':
                result = a - b
                break
            case 'multiply':
                result = a * b
                break
            case 'divide':
                if (b === 0) {
                    throw new Error('Division by zero is not allowed')
                }
                result = a / b
                break
            default:
                throw new Error(`Unknown operation: ${operation}`)
        }

        return `Result: ${a} ${operation} ${b} = ${result}`
    },
    {
        name: 'calculator',
        description:
            'Performs basic arithmetic operations. Use this tool when you need to calculate mathematical expressions. Supports addition, subtraction, multiplication, and division.',
        schema: calculatorSchema,
    }
)

