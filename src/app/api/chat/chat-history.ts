/**
 * Chat history persistence and retrieval for the agent
 */

import { AIMessage, HumanMessage } from '@langchain/core/messages'

import prisma from '@/lib/db'

export async function getChatHistory(
  userId: string | null,
  sessionId: string
): Promise<(HumanMessage | AIMessage)[]> {
  const history = await prisma.chatMessage.findMany({
    where: {
      OR: [userId ? { userId } : { sessionId }, { sessionId }],
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
  })

  return history
    .reverse()
    .map((msg: { role: string; content: string }) =>
      msg.role === 'user'
        ? new HumanMessage(msg.content)
        : new AIMessage(msg.content)
    )
}

export async function persistUserMessage(
  content: string,
  userId: string | null,
  sessionId: string
): Promise<void> {
  await prisma.chatMessage.create({
    data: {
      content,
      role: 'user',
      userId,
      sessionId,
    },
  })
}

export async function persistAiMessage(
  content: string,
  userId: string | null,
  sessionId: string
): Promise<void> {
  await prisma.chatMessage.create({
    data: {
      content,
      role: 'assistant',
      userId,
      sessionId,
    },
  })
}
