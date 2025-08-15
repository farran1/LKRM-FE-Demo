import { Request, Response } from 'express'
import { AuthRequest } from '@/middlewares/auth'
import { db } from '@/services/database'
import { createVolunteerSchema } from '@/validations/volunteer'
import path from 'path'
import { randomUUID } from 'crypto'
// Mock AWS S3 for frontend static export
const s3 = {
  send: async (command: any) => ({ ETag: 'mock-etag' })
}
const S3_BUCKET = 'mock-bucket'
const PutObjectCommand = class MockPutObjectCommand {
  constructor(params: any) {
    this.params = params;
  }
  params: any;
}

export default class VolunteerController {
  async create(req: AuthRequest, res: Response) {
    const validation = createVolunteerSchema.safeParse(req.body)
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
      eventId,
      phoneNumber
    } = validation.data
    // Mock file handling for frontend static export
    const file = null

    try {
      const existEvent = await db.event.findUnique({ where: { id: eventId, createdBy: userId } })
      if (!existEvent) {
        return res.status(400).json({ error: 'Event not found' })
      }

      let fileUrl = null
      // File upload disabled for frontend static export

      const newVolunteer = await db.volunteer.create({
        data: {
          name,
          avatar: fileUrl,
          phoneNumber,
          createdBy: userId,
          updatedBy: userId
        },
      })

      await db.volunteerEvent.create({
        data: {
          volunteerId: newVolunteer.id,
          eventId: eventId,
          createdBy: userId,
          updatedBy: userId
        }
      })

      return res.status(201).json({
        volunteer: newVolunteer
      })
    } catch (error) {
      console.error(error)
      return res.status(500).json({ error: 'Internal server error' })
    }
  }

  async getByEvent(req: AuthRequest, res: Response) {
    const { id } = req.params
    const { sortBy, sortDirection } = req.query
    
    const eventId = Number(id)
    const page = 1
    const perPage = 20
    const skip = (page - 1) * perPage;

    const filters: any = {}
    filters.createdBy = req.userId

    const sorts: any = {}
    if (sortBy) {
      // @ts-ignore
      sorts.volunteer = { [sortBy]: sortDirection || 'desc'}
    } else {
      sorts.volunteer = { id: 'desc' }
    }

    try {
      const [volunteerData, total] = await Promise.all([
        db.volunteerEvent.findMany({
          where: {
            eventId,
          },
          orderBy: sorts,
          skip,
          take: perPage,
          select: {
            volunteer: true
          },
        }),
        db.volunteerEvent.count({
          where: {
            eventId,
          },
        }),
      ])
      const volunteers = volunteerData.map((pe: any) => pe.volunteer);

      return res.json({
        data: volunteers,
        meta: {
          total,
          page,
          perPage,
          totalPages: Math.ceil(total / perPage),
        },
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}