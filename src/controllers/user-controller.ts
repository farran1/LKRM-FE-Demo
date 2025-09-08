import { Response } from 'express'
import { AuthRequest } from '@/middlewares/auth'
import { db } from '@/services/database'

export class UserController {
  async test(req: AuthRequest, res: Response) {
    console.log('Test endpoint called!')
    res.json({ message: 'Test endpoint working', timestamp: new Date().toISOString() })
  }

  async testUsers(req: AuthRequest, res: Response) {
    console.log('Test users endpoint called!')
    // Return static test data
    const testUsers = [
      { id: 1, username: 'testuser1', email: 'test1@example.com', isActive: true, role: 'COACH' },
      { id: 2, username: 'testuser2', email: 'test2@example.com', isActive: true, role: 'COACH' }
    ]
    res.json({ data: testUsers })
  }

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

  async index(req: AuthRequest, res: Response) {
    try {
      console.log('Fetching users from database...')
      console.log('User ID from request:', req.userId)
      
      // TEMPORARY: Return static data instead of database query
      console.log('Using static data for testing...')
      const users = [
        { id: 1, username: 'user1', email: 'user1@example.com', isActive: true, role: 'COACH' },
        { id: 2, username: 'user2', email: 'user2@example.com', isActive: true, role: 'COACH' }
      ]
      
      console.log('Users found:', users.length)
      console.log('First user sample:', users[0])
      console.log('All users:', JSON.stringify(users, null, 2))
      
      const response = { data: users }
      console.log('Sending response:', JSON.stringify(response, null, 2))
      
      res.json(response)
    } catch (error) {
      console.error('Error fetching users:', error)
      const err = error as Error
      console.error('Error details:', {
        message: err.message,
        stack: err.stack,
        name: err.name
      })
      res.status(500).json({ error: "Internal server error", details: err.message })
    }
  }
}