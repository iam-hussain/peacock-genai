import { Router, type Request, type Response } from 'express'

export const apiRouter = Router()

apiRouter.get('/', (req: Request, res: Response) => {
    res.json({
        message: 'API is running',
        version: '0.1.0',
    })
})

// Add more routes here as needed
// Example:
// apiRouter.get('/users', getUsersHandler)
// apiRouter.post('/users', createUserHandler)
