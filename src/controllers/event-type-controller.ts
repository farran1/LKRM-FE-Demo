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
      let eventTypes = await db.eventType.findMany();

      // Seed defaults if empty so UI always has common types
      if (!eventTypes || eventTypes.length === 0) {
        const defaults = [
          { name: 'Practice',   color: '#2196f3', txtColor: '#ffffff' },
          { name: 'Game',       color: '#4ecdc4', txtColor: '#ffffff' },
          { name: 'Workout',    color: '#9c27b0', txtColor: '#ffffff' },
          { name: 'Meeting',    color: '#4caf50', txtColor: '#ffffff' },
          { name: 'Scrimmage',  color: '#ff9800', txtColor: '#ffffff' },
          { name: 'Tournament', color: '#ff5722', txtColor: '#ffffff' },
        ]

        // createMany will ignore duplicates if skipDuplicates supported
        // fall back to creating one-by-one if needed
        try {
          // @ts-ignore - prisma createMany skipDuplicates available in runtime
          await db.eventType.createMany({ data: defaults, skipDuplicates: true })
        } catch {
          for (const d of defaults) {
            try { await db.eventType.create({ data: d }) } catch {}
          }
        }

        eventTypes = await db.eventType.findMany();
      }

      return res.json({ data: eventTypes });
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