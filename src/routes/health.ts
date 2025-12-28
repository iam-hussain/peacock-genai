import { Router, type Request, type Response } from 'express'

export const healthRouter = Router()

healthRouter.get('/', (req: Request, res: Response) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
    })
})
