import { Response } from 'express'
import { AuthRequest } from '@/middlewares/auth'
import { createEventTypeSchema } from '@/validations/create-event-type'
import { db } from '@/services/database'
import { formatError } from '@/utils/app'

export default class EventTypeController {
  async getAll(req: AuthRequest, res: Response) {
    const userId = req.userId
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" })
    }

    try {
      const eventTypes = await db.eventType.findMany();

      return res.json({
        data: eventTypes
      });
    } catch (error) {
      console.error('Error fetching event types:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  async create(req: AuthRequest, res: Response) {
    const validation = createEventTypeSchema.safeParse(req.body)
    const userId = req.userId
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" })
    }

    if (!validation.success) {
      // return res.status(400).json({ error: formatError(validate.error) })
      return res.status(400).json({ error: validation.error.issues })
    }

    const {
      name,
      color,
      txtColor
    } = req.body
    
    console.log('userId ', userId)

    try {
      const existingEventType = await db.eventType.findUnique({ where: { name } })
      if (existingEventType) {
        return res.status(400).json({ error: 'Event Type Name already exists' })
      }

      const newRecord = await db.eventType.create({
        data: {
          name,
          color,
          txtColor,
          createdBy: userId,
          updatedBy: userId
        },
      })

      return res.status(201).json(newRecord)
    } catch (error) {
      console.error(error)
      return res.status(500).json({ error: 'Internal server error' })
    }
  }
}