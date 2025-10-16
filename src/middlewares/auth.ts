import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

export interface AuthRequest extends Request {
  userId?: number
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  let token = req.cookies.access_token
  if (!token) {
    const authHeader = req.headers['authorization']
    token = authHeader?.split(' ')[1]
  }

  if (!token) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  try {
    const secret = process.env.JWT_SECRET as string
    const payload = jwt.verify(token, secret) as { userId: number }
    if (!payload.userId) {
      res.status(401).json({ error: 'Invalid token' })
      return
    }

    req.userId = payload.userId
    next()
  } catch (err) {
    const name = (err as any)?.name
    if (name === 'TokenExpiredError') {
      res.status(401).json({ error: 'Token expired' })
    } else if (name === 'JsonWebTokenError') {
      res.status(403).json({ error: 'Invalid token' })
    } else {
      res.status(500).json({ error: 'Token verification failed' })
    }
  }
}