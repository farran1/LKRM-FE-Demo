import { Request, Response } from 'express'
import { AuthRequest } from '@/middlewares/auth'
import { db } from '@/services/database'
import { formatError } from '@/utils/app'
import path from 'path'
import { randomUUID } from 'crypto'
import { s3, S3_BUCKET } from '@/services/aws'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { listPlayerSchema, createPlayerSchema, updatePlayerSchema, updateNoteSchema, updateGoalSchema, validateImportPlayerSchema, importPlayerSchema } from '@/validations/player'
import xlsx from 'xlsx'
import { v4 as uuidv4 } from "uuid"

export default class PlayerController {
  async index(req: AuthRequest, res: Response) {
    const validate = listPlayerSchema.safeParse(req.query)
    if (!validate.success) {
      return res.status(400).json({ error: formatError(validate.error) })
    }

    const { name, positionIds, jersey, fromWeight, toWeight, fromHeight, toHeight, sortBy, sortDirection } = validate.data
    const page = validate.data.page || 1
    const perPage = validate.data.perPage || 20
    const skip = (page - 1) * perPage

    const filters: any = {}
    filters.createdBy = req.userId

    if (name) {
      filters.name = { contains: name, mode: 'insensitive' }
    }

    if (positionIds) {
      filters.positionId = { in: positionIds }
    }

    if (jersey) {
      filters.jersey = jersey
    }

    if (fromWeight && toWeight) {
      filters.weight = { gte: fromWeight, lte: toWeight }
    }
    if (fromHeight && toHeight) {
      filters.weight = { gte: fromHeight, lte: toHeight }
    }

    const sorts: any = {}
    if (sortBy) {
      if (sortBy === 'position') {
        // @ts-ignore
        sorts.position = { name: sortDirection || 'desc' }
      } else {
        // @ts-ignore
        sorts[sortBy] = sortDirection || 'desc'
      }
    } else {
      sorts.id = 'desc'
    }

    try {
      const [players, total] = await Promise.all([
        db.player.findMany({
          where: filters,
          skip,
          take: perPage,
          orderBy: sorts,
          include: {
            position: true
          }
        }),
        db.player.count(),
      ])

      return res.json({
        data: players,
        meta: {
          total,
          page,
          perPage,
          totalPages: Math.ceil(total / perPage),
        },
      })
    } catch (error) {
      console.error(error)
      return res.status(500).json({ error: 'Internal Server Error' })
    }
  }

  async createPlayer(req: AuthRequest, res: Response) {
    const validation = createPlayerSchema.safeParse(req.body)
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
      positionId,
      jersey,
      phoneNumber,
      weight,
      height,
      notes,
      goals
    } = validation.data
    const file = req.file

    try {
      if (eventId) {
        const existEvent = await db.event.findUnique({ where: { id: eventId } })
        if (!existEvent) {
          return res.status(400).json({ error: 'Event not found' })
        }
      }

      const existPosition = await db.position.findUnique({ where: { id: positionId } })
      if (!existPosition) {
        return res.status(400).json({ error: 'Position not found' })
      }

      let fileUrl = null
      if (file) {
        const ext = path.extname(file.originalname)
        const key = `avatars/${randomUUID()}${ext}`

        // Upload to S3
        await s3.send(
          new PutObjectCommand({
            Bucket: S3_BUCKET,
            Key: key,
            Body: file.buffer,
            ContentType: file.mimetype
          })
        )
        fileUrl = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`
      }

      const newPlayer = await db.player.create({
        data: {
          name,
          positionId,
          avatar: fileUrl,
          jersey,
          phoneNumber,
          weight,
          height,
          createdBy: userId,
          updatedBy: userId
        },
      })

      if (eventId) {
        await db.playerEvent.create({
          data: {
            playerId: newPlayer.id,
            eventId: eventId,
            createdBy: userId,
            updatedBy: userId
          }
        })
      }

      if (notes) {
        let playerNotes: Array<any> = []
        notes?.forEach((note) => {
          playerNotes.push({
            playerId: newPlayer.id,
            note,
            createdBy: userId,
            updatedBy: userId
          })
        })

        if (playerNotes.length) {
          await db.playerNote.createMany({
            data: playerNotes,
            skipDuplicates: true,
          })
        }
      }

      if (goals) {
        let playerGoals: Array<any> = []
        goals?.forEach((goal) => {
          playerGoals.push({
            playerId: newPlayer.id,
            note: goal,
            createdBy: userId,
            updatedBy: userId
          })
        })

        if (playerGoals.length) {
          await db.playerGoal.createMany({
            data: playerGoals,
            skipDuplicates: true,
          })
        }
      }

      return res.status(201).json({
        player: newPlayer
      })
    } catch (error) {
      console.error(error)
      return res.status(500).json({ error: 'Internal server error' })
    }
  }

  async updatePlayer(req: AuthRequest, res: Response) {
    const { id } = req.params
    const playerId = Number(id)
    if (isNaN(playerId)) {
      return res.status(400).json({ message: 'Invalid Player ID' })
    }

    const validation = updatePlayerSchema.safeParse(req.body)
    const userId = req.userId
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" })
    }

    if (!validation.success) {
      const errors = validation.error.format()
      console.log(validation.error.stack)
      return res.status(400).json({ error: 'Validation error', errors })
    }

    const {
      name,
      positionId,
      jersey,
      phoneNumber,
      weight,
      height,
    } = validation.data
    const file = req.file

    try {
      const existPosition = await db.position.findUnique({ where: { id: positionId } })
      if (!existPosition) {
        return res.status(400).json({ error: 'Position not found' })
      }

      let fileUrl = null
      if (file) {
        const ext = path.extname(file.originalname)
        const key = `avatars/${randomUUID()}${ext}`

        // Upload to S3
        await s3.send(
          new PutObjectCommand({
            Bucket: S3_BUCKET,
            Key: key,
            Body: file.buffer,
            ContentType: file.mimetype
          })
        )
        fileUrl = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`
      }

      const updatedPlayer = await db.player.update({
        where: ({ id: playerId, createdBy: userId }),
        data: {
          name,
          positionId,
          avatar: fileUrl,
          jersey,
          phoneNumber,
          weight,
          height,
          updatedBy: userId
        },
      })

      return res.status(201).json({
        player: updatedPlayer
      })
    } catch (error) {
      console.error(error)
      return res.status(500).json({ error: 'Internal server error' })
    }
  }

  async getPositions(req: AuthRequest, res: Response) {
    try {
      const positions = await db.position.findMany()

      return res.json({
        data: positions
      })
    } catch (error) {
      console.error(error)
      return res.status(500).json({ error: 'Internal Server Error' })
    }
  }

  async getPlayerByEvent(req: AuthRequest, res: Response) {
    const { id } = req.params
    const { sortBy, sortDirection } = req.query

    const eventId = Number(id)
    const page = 1
    const perPage = 20
    const skip = (page - 1) * perPage

    const filters: any = {}
    filters.createdBy = req.userId

    const sorts: any = {}
    if (sortBy) {
      if (sortBy === 'position') {
        // @ts-ignore
        sorts.player = { position: { name: sortDirection || 'desc' } }
      } else {
        // @ts-ignore
        sorts.player = { [sortBy]: sortDirection || 'desc'}
      }
    } else {
      sorts.player = { id: 'desc' }
    }

    try {
      const [playersData, total] = await Promise.all([
        db.playerEvent.findMany({
          where: {
            eventId,
          },
          orderBy: sorts,
          skip,
          take: perPage,
          select: {
            player: {
              include: {
                position: true,
              },
            }
          },
        }),
        db.playerEvent.count({
          where: {
            eventId,
          },
        }),
      ])
      const players = playersData.map(pe => pe.player)

      return res.json({
        data: players,
        meta: {
          total,
          page,
          perPage,
          totalPages: Math.ceil(total / perPage),
        },
      })
    } catch (error) {
      console.error(error)
      return res.status(500).json({ error: 'Internal Server Error' })
    }
  }

  async getPlayerById(req: AuthRequest, res: Response) {
    const { id } = req.params
    const playerId = Number(id)
    if (isNaN(playerId)) {
      return res.status(400).json({ message: 'Invalid Player ID' })
    }

    const userId = req.userId
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" })
    }

    try {
      const player = await db.player.findUnique({
        where: { id: playerId, createdBy: userId },
        include: {
          notes: true,
          goals: true,
          position: true,
        },
      })

      if (!player) {
        return res.status(404).json({ message: 'Player not found' })
      }

      return res.json({ player })
    } catch (error) {
      console.error('Error fetching:', error)
      return res.status(500).json({ message: 'Internal server error' })
    }
  }

  async getNotes(req: AuthRequest, res: Response) {
    const { id } = req.params
    const playerId = Number(id)
    if (isNaN(playerId)) {
      return res.status(400).json({ message: 'Invalid Player ID' })
    }

    const userId = req.userId
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" })
    }

    try {
      const notes = await db.playerNote.findMany({
        where: { playerId, createdBy: userId },
        include: {
          createdUser: {
            include: {
              profile: {
                select: {
                  firstName: true,
                  lastName: true
                }
              }
            }
          }
        }
      })

      return res.json({ notes })
    } catch (error) {
      console.error('Error fetching:', error)
      return res.status(500).json({ message: 'Internal server error' })
    }
  }

  async getGoals(req: AuthRequest, res: Response) {
    const { id } = req.params
    const playerId = Number(id)
    if (isNaN(playerId)) {
      return res.status(400).json({ message: 'Invalid Player ID' })
    }

    const userId = req.userId
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" })
    }

    try {
      const goals = await db.playerGoal.findMany({
        where: { playerId, createdBy: userId },
        include: {
          createdUser: {
            include: {
              profile: {
                select: {
                  firstName: true,
                  lastName: true
                }
              }
            }
          }
        }
      })

      return res.json({ goals })
    } catch (error) {
      console.error('Error fetching:', error)
      return res.status(500).json({ message: 'Internal server error' })
    }
  }

  async updateNotes(req: AuthRequest, res: Response) {
    const validation = updateNoteSchema.safeParse(req.body)
    const { id } = req.params
    const playerId = Number(id)
    if (isNaN(playerId)) {
      return res.status(400).json({ message: 'Invalid Player ID' })
    }

    const userId = req.userId
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" })
    }

    if (!validation.success) {
      const errors = validation.error.format()
      return res.status(400).json({ error: 'Validation error', errors })
    }

    const {
      notes
    } = validation.data

    try {
      await db.playerNote.deleteMany({
        where: ({ playerId, createdBy: userId })
      })

      let playerNotes: Array<any> = []
      notes.forEach((note: string) => {
        playerNotes.push({
          playerId: playerId,
          note,
          createdBy: userId,
          updatedBy: userId
        })
      })

      if (playerNotes.length) {
        await db.playerNote.createMany({
          data: playerNotes,
        })
      }

      return res.status(200).json({ message: 'ok' })
    } catch (error) {
      console.error('Error fetching:', error)
      return res.status(500).json({ message: 'Internal server error' })
    }
  }

  async updateGoals(req: AuthRequest, res: Response) {
    const validation = updateGoalSchema.safeParse(req.body)
    const { id } = req.params
    const playerId = Number(id)
    if (isNaN(playerId)) {
      return res.status(400).json({ message: 'Invalid Player ID' })
    }

    const userId = req.userId
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" })
    }

    if (!validation.success) {
      const errors = validation.error.format()
      return res.status(400).json({ error: 'Validation error', errors })
    }

    const {
      goals
    } = validation.data

    try {
      await db.playerGoal.deleteMany({
        where: ({ playerId, createdBy: userId })
      })

      let playerGoals: Array<any> = []
      goals.forEach((note: string) => {
        playerGoals.push({
          playerId: playerId,
          note,
          createdBy: userId,
          updatedBy: userId
        })
      })

      if (playerGoals.length) {
        await db.playerGoal.createMany({
          data: playerGoals,
        })
      }

      return res.status(200).json({ message: 'ok' })
    } catch (error) {
      console.error('Error fetching:', error)
      return res.status(500).json({ message: 'Internal server error' })
    }
  }

  async uploadImportPlayers(req: AuthRequest, res: Response) {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" })
    }

    const userId = req.userId
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" })
    }

    const importId = uuidv4()

    try {
      // Read uploaded file
      const workbook = xlsx.readFile(req.file.path)
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const rows = xlsx.utils.sheet_to_json<Record<string, any>>(worksheet)

      for (const [index, row] of rows.entries()) {
        console.log()
        const errors: any[] = []
        try {
          if (
            !row["Position"] && !row["Name"] && !row["Jersey"] && !row["Phone Number"] && !row["Weight"] && !row["Height"]
          ) continue

          await db.playerImport.create({
            data: {
              importId,
              name: row["Name"]?.toString() || null,
              jersey: row["Jersey"]?.toString() || null,
              phoneNumber: row["Phone Number"]?.toString() || null,
              weight: row["Weight"]?.toString() || null,
              height: row["Height"] ?.toString()|| null,
              position: row["Position"]?.toString() || null,
              createdBy: userId
            },
          })
        } catch (err: any) {
          console.error(`Row ${index + 1} insert error:`, err)
          errors.push({
            row: index + 1,
            reason: err.message || "Unknown error",
          })
        }
      }

      res.json({
        importId
      })
    } catch (err) {
      console.error("Import error:", err)
      res.status(500).json({ message: "Failed to import players" })
    }
  }

  async validatePlayers(req: AuthRequest, res: Response) {
    const validation = validateImportPlayerSchema.safeParse(req.body)

    if (!validation.success) {
      const errors = validation.error.format()
      return res.status(400).json({ error: 'Validation error', errors })
    }

    const userId = req.userId
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" })
    }

    const { importId } = validation.data
    try {
      const imports = await db.playerImport.findMany({
        where: { importId }
      })

      const data = await Promise.all(
        imports.map(async (row: any) => {
          const rowMap: Record<string, any> = {}
          rowMap.id = row.id

          const positionName = row.position
          const position = await db.position.findFirst({
            where: { name: positionName },
          })

          if (!position) {
            const error = `Position "${positionName}" not found`
            rowMap.position = { value: row.position, error }
          } else {
            rowMap.position = { value: row.position }
          }

          if (!row.name) {
            const error = 'Name must not be empty'
            rowMap.name = { value: row.name, error }
          } else {
            rowMap.name = { value: row.name }
          }

          if (!row.jersey) {
            const error = 'Jersey must not be empty'
            rowMap.jersey = { value: row.jersey, error }
          } else {
            rowMap.jersey = { value: row.jersey }
          }

          if (!row.phoneNumber) {
            const error = 'Phone Number must not be empty'
            rowMap.phoneNumber = { value: row.phoneNumber, error }
          } else {
            rowMap.phoneNumber = { value: row.phoneNumber }
          }

          if (!row.weight) {
            const error = 'Weight must not be empty'
            rowMap.weight = { value: row.weight, error }
          } else if (isNaN(row.weight)) {
            const error = 'Weight must be a number'
            rowMap.weight = { value: row.weight, error }
          } else {
            rowMap.weight = { value: row.weight }
          }

          if (!row.height) {
            const error = 'Height must not be empty'
            rowMap.height = { value: row.height, error }
          } else if (isNaN(row.height)) {
            const error = 'Height must be a number'
            rowMap.height = { value: row.height, error }
          } else {
            rowMap.height = { value: row.height }
          }

          return rowMap
        })
      )

      return res.json({
        data
      })
    } catch (err: any) {
      console.error('Error fetching:', err)
      return res.status(500).json({ message: 'Internal server error' })
    }
  }

  async importPlayers(req: AuthRequest, res: Response) {
    const validation = importPlayerSchema.safeParse(req.body)

    if (!validation.success) {
      const errors = validation.error.format()
      return res.status(400).json({ error: 'Validation error', errors })
    }

    const userId = req.userId
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" })
    }

    const { importId, option } = validation.data
    try {
      const imports = await db.playerImport.findMany({
        where: { importId }
      })

      const players: any[] = []
      imports.forEach(async (row: any) => {
        const positionName = row.position
        const position = await db.position.findFirst({
          where: { name: positionName },
        })

        if (!position) {
          return
        }

        if (!row.name) {
          return
        }
        if (!row.jersey) {
          return
        }
        if (!row.phoneNumber) {
          return
        }
        if (!row.weight || isNaN(row.weight)) {
          return
        }
        if (!row.height || isNaN(row.height)) {
          return
        }
        players.push({
          name: row.name,
          positionId: position.id,
          jersey: row.jersey,
          phoneNumber: row.phoneNumber,
          weight: parseFloat(row.weight),
          height: parseFloat(row.height),
          createdBy: userId,
          updatedBy: userId
        })
      })

      if (option === 'overwrite') {
        await db.player.deleteMany({
          where: { createdBy: userId }
        })
      }

      console.log('players ', players)
      await db.player.createMany({
        data: players,
        skipDuplicates: true,
      })
      await db.playerImport.deleteMany({ where: { importId } })

      res.json({
        message: 'success',
        total: players.length
      })
    } catch (err: any) {
      console.error('Error fetching:', err)
      return res.status(500).json({ message: 'Internal server error' })
    }
  }
}