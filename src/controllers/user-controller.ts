import { Response } from 'express'
import { AuthRequest } from '@/middlewares/auth'
import { db } from '@/services/database'

export class UserController {
  async me(req: AuthRequest, res: Response) {
    const userId = req.userId

    try {
      const user = await db.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          username: true,
          email: true,
          isActive: true,
          role: true,
          profile: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        },
      })

      if (!user) {
        return res.status(404).json({ error: "User not found" })
      }

      res.json({ user })
    } catch (error) {
      res.status(500).json({ error: "Internal server error" })
    }
  }
}