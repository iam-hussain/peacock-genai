import { calculatorTool } from './calculator'

/**
 * Tool Registry
 * 
 * Best practices:
 * - Centralized tool exports
 * - Easy to add new tools
 * - Single import point for agent setup
 */
export const tools = [calculatorTool]

export { calculatorTool }

