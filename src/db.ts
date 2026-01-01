import { PrismaClient } from '@prisma/client'

// Prisma can be forced into the Accelerate/edge "client" engine via env.
// That requires an adapter/accelerateUrl and will crash locally. Force binary.
delete process.env.PRISMA_ACCELERATE_URL
delete process.env.PRISMA_ENGINE_ENDPOINT
process.env.PRISMA_CLIENT_ENGINE_TYPE = 'binary'

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: ['error'],
  })
}

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>
} & typeof global

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma
