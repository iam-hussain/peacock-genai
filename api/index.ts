import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createApp } from '../src/app'

const app = createApp()

// Vercel serverless function handler
// This exports the Express app as a serverless function
export default async (req: VercelRequest, res: VercelResponse) => {
  return app(req as any, res as any)
}
