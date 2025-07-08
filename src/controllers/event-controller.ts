import { Request, Response } from 'express'
import { createEventSchema, updateEventSchema } from '@/validations/event'
import moment from 'moment'
import { AuthRequest } from '@/middlewares/auth'
import { listEventSchema } from '@/validations/event'
import { db } from '@/services/database'
import { formatError } from '@/utils/app'

export class EventController {
  async index(req: AuthRequest, res: Response) {
    const validate = listEventSchema.safeParse(req.query)
    if (!validate.success) {
      return res.status(400).json({ error: formatError(validate.error) })
      // return res.status(400).json({ error: validate.error.issues })
    }

    const { name, startDate, endDate, eventTypeIds, location, venue, sortBy, sortDirection } = validate.data
    const page = validate.data.page || 1
    const perPage = validate.data.perPage || 20
    const skip = (page - 1) * perPage;

    const filters: any = {}

    const userId = req.userId
    filters.createdBy = userId

    if (name) {
      filters.name = { contains: name, mode: 'insensitive' }
    }

    if (startDate && endDate) {
      filters.startTime = { gte: new Date(startDate), lte: new Date(endDate) }
    } else if (startDate) {
      filters.startTime = { gte: new Date(startDate) }
    } else if (endDate) {
      filters.startTime = { lte: new Date(endDate) }
    }

    if (eventTypeIds) {
      filters.eventTypeId = { in: eventTypeIds }
    }

    if (location) {
      // Validate location enum
      if (location === 'HOME' || location === 'AWAY') {
        filters.location = location
      }
    }

    if (venue) {
      filters.venue = { contains: venue, mode: 'insensitive' }
    }

    const sorts: any = {}
    if (sortBy) {
      sorts[sortBy] = sortDirection || 'desc'
    } else {
      sorts.id = 'desc'
    }

    try {
      const [events, total] = await Promise.all([
        db.event.findMany({
          where: filters,
          skip,
          take: perPage,
          orderBy: sorts,
          include: {
            eventType: true
          }
        }),
        db.event.count({ where: filters }),
      ]);

      return res.json({
        data: events,
        meta: {
          total,
          page,
          perPage,
          totalPages: Math.ceil(total / perPage),
        },
      });
    } catch (error) {
      console.error('Error fetching events:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  async createEvent(req: AuthRequest, res: Response) {
    const validation = createEventSchema.safeParse(req.body)
    const userId = req.userId
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" })
    }

    if (!validation.success) {
      const errors = validation.error.format()
      return res.status(400).json({ error: 'Validation error', errors })
    }

    const {
      name,
      eventTypeId,
      startTime,
      endTime,
      isRepeat,
      occurence,
      location,
      venue,
      oppositionTeam
    } = validation.data

    let eventStart = moment(startTime)
    let eventEnd = null
    if (endTime) {
      eventEnd = moment(endTime)
      if (eventEnd.isBefore(eventStart)) {
        return res.status(400).json({ error: 'Start Date must be after End Date' })
      }
    }

    try {
      // Check for existing user
      const existEventType = await db.eventType.findUnique({ where: { id: eventTypeId } })
      if (!existEventType) {
        return res.status(409).json({ error: 'Event Type not found' })
      }

      const newEvent = await db.event.create({
        data: {
          name,
          eventTypeId,
          startTime: startTime,
          endTime: endTime,
          isRepeat,
          occurence,
          location,
          venue,
          oppositionTeam,
          createdBy: userId,
          updatedBy: userId
        },
      })

      return res.status(201).json({
        event: newEvent
      })
    } catch (error) {
      console.error(error)
      return res.status(500).json({ error: 'Internal server error' })
    }
  }

  async getEventById(req: AuthRequest, res: Response) {
    const { id } = req.params
    const eventId = Number(id)
    if (isNaN(eventId)) {
      return res.status(400).json({ message: 'Invalid event ID' })
    }

    try {
      const event = await db.event.findUnique({
        where: { id: eventId },
        include: {
          eventType: true,
        },
      })

      if (!event) {
        return res.status(404).json({ message: 'Event not found' })
      }

      res.json({ event })
    } catch (error) {
      console.error('Error fetching event:', error)
      res.status(500).json({ message: 'Internal server error' })
    }
  }

  async updateEvent(req: AuthRequest, res: Response) {
    const { id } = req.params
    const eventId = Number(id)
    if (isNaN(eventId)) {
      return res.status(400).json({ message: 'Invalid event ID' })
    }

    const userId = req.userId
    const validation = updateEventSchema.safeParse(req.body)
    if (!validation.success) {
      const errors = validation.error.format()
      return res.status(400).json({ error: 'Validation error' })
    }

    const {
      name,
      eventTypeId,
      startTime,
      endTime,
      isRepeat,
      occurence,
      location,
      venue,
      oppositionTeam
    } = validation.data

    let eventStart = moment(startTime)
    let eventEnd = null
    if (endTime) {
      eventEnd = moment(endTime)
      if (eventEnd.isBefore(eventStart)) {
        return res.status(400).json({ error: 'Start Date must be after End Date' })
      }
    }

    try {
      // Check for existing user
      const existEventType = await db.eventType.findUnique({ where: { id: eventTypeId } })
      if (!existEventType) {
        return res.status(409).json({ error: 'Event Type not found' })
      }

      const newEvent = await db.event.update({
        where: ({ id: eventId }),
        data: {
          name,
          eventTypeId,
          startTime: startTime,
          endTime: endTime,
          isRepeat,
          occurence,
          location,
          venue,
          oppositionTeam,
          updatedBy: userId
        },
      })

      return res.status(201).json({
        event: newEvent
      })
    } catch (error) {
      console.error(error)
      return res.status(500).json({ error: 'Internal server error' })
    }
  }
}