import { Request, Response } from 'express'
import { AuthRequest } from '@/middlewares/auth'
import { db } from '@/services/database'
import { formatError } from '@/utils/app'
import { createTaskSchema, listTaskSchema, updateTaskSchema } from '@/validations/task'
import moment from 'moment'

export default class TaskController {
  async index(req: AuthRequest, res: Response) {
    const validate = listTaskSchema.safeParse(req.query)
    if (!validate.success) {
      return res.status(400).json({ error: formatError(validate.error) })
      // return res.status(400).json({ error: validate.error.issues })
    }

    const { viewMode } = validate.data

    try {
      if (viewMode === 'calendar') {
        // @ts-ignore
        return await this.getCalendarView(validate.data, req.userId, res)
      } else if (viewMode === 'progress') {
        // @ts-ignore
        return await this.getProgressView(validate.data, req.userId, res)
      } else {
        // @ts-ignore
        return await this.getListView(validate.data, req.userId, res)
      }
    } catch (error) {
      console.error('Error fetching tasks:', error)
      return res.status(500).json({ error: 'Internal Server Error' })
    }
  }

  async getCalendarView(data: any, userId: number, res: Response) {
    const { name, dueDate, playerIds, priorityId, eventId, status, sortBy, sortDirection, viewMode, startDate, endDate } = data

    const filters: any = {}

    if (playerIds) {
      filters.playerTasks = {
        some: {
          playerId: {
            in: playerIds,
          },
        }
      }
    }

    filters.createdBy = userId

    if (name) {
      filters.name = { contains: name, mode: 'insensitive' }
    }

    if (dueDate) {
      filters.dueDate = moment(dueDate, 'YYYY-MM-DD').startOf('day').toISOString()
    } else if (startDate && endDate) {
      filters.dueDate = {
        gte: moment(startDate, 'YYYY-MM-DD').startOf('day').toISOString(),
        lte: moment(endDate, 'YYYY-MM-DD').endOf('day').toISOString(),
      }
    } else if (startDate) {
      filters.dueDate = { gte: moment(startDate, 'YYYY-MM-DD').startOf('day').toISOString() }
    } else if (endDate) {
      filters.dueDate = { lte: moment(endDate, 'YYYY-MM-DD').endOf('day').toISOString() }
    }

    if (priorityId) {
      filters.priorityId = priorityId
    }

    if (eventId) {
      filters.eventId = eventId
    }

    if (status) {
      filters.status = status
    }

    const [tasks] = await Promise.all([
      db.task.findMany({
        where: filters,
        include: {
          playerTasks: {
            include: {
              player: true
            }
          },
          priority: true,
          event: true
        }
      }),
    ])

    return res.json({
      tasks
    })
  }

  async getProgressView(data: any, userId: number, res: Response) {
    const { name, dueDate, playerIds, priorityId, eventId, status, sortBy, sortDirection, viewMode, startDate, endDate } = data

    const filters: any = {}

    if (playerIds) {
      filters.playerTasks = {
        some: {
          playerId: {
            in: playerIds,
          },
        }
      }
    }

    filters.createdBy = userId

    if (name) {
      filters.name = { contains: name, mode: 'insensitive' }
    }

    if (dueDate) {
      filters.dueDate = moment(dueDate, 'YYYY-MM-DD').startOf('day').toISOString()
    } else if (startDate && endDate) {
      filters.dueDate = {
        gte: moment(startDate, 'YYYY-MM-DD').startOf('day').toISOString(),
        lte: moment(endDate, 'YYYY-MM-DD').endOf('day').toISOString(),
      }
    } else if (startDate) {
      filters.dueDate = { gte: moment(startDate, 'YYYY-MM-DD').startOf('day').toISOString() }
    } else if (endDate) {
      filters.dueDate = { lte: moment(endDate, 'YYYY-MM-DD').endOf('day').toISOString() }
    }

    if (priorityId) {
      filters.priorityId = priorityId
    }

    if (eventId) {
      filters.eventId = eventId
    }

    if (status) {
      filters.status = status
    }

    const todoTasks = await db.task.findMany({
      where: { ...filters, status: 'TODO' },
      include: {
        playerTasks: {
          include: {
            player: true
          }
        },
        priority: true,
        event: true
      }
    })

    const inProgressTasks = await db.task.findMany({
      where: { ...filters, status: 'IN_PROGRESS' },
      include: {
        playerTasks: {
          include: {
            player: true
          }
        },
        priority: true,
        event: true
      }
    })

    const doneTasks = await db.task.findMany({
      where: { ...filters, status: 'DONE' },
      include: {
        playerTasks: {
          include: {
            player: true
          }
        },
        priority: true,
        event: true
      }
    })

    return res.json({
      todoTasks,
      inProgressTasks,
      doneTasks
    })
  }

  async getListView(data: any, userId: number, res: Response) {
    const { name, dueDate, playerIds, priorityId, eventId, status, sortBy, sortDirection, viewMode, startDate, endDate } = data
    const page = data.page || 1
    const perPage = data.perPage || 20
    const skip = (page - 1) * perPage

    const filters: any = {}

    if (playerIds) {
      filters.playerTasks = {
        some: {
          playerId: {
            in: playerIds,
          },
        }
      }
    }

    filters.createdBy = userId

    if (name) {
      filters.name = { contains: name, mode: 'insensitive' }
    }

    if (startDate && endDate) {
      filters.dueDate = { gte: new Date(startDate), lte: new Date(endDate) }
    } else if (startDate) {
      filters.dueDate = { gte: new Date(startDate) }
    } else if (endDate) {
      filters.dueDate = { lte: new Date(endDate) }
    } else if (dueDate) {
      filters.dueDate = { gte: new Date(dueDate) }
    }

    if (priorityId) {
      filters.priorityId = priorityId
    }

    if (eventId) {
      filters.eventId = eventId
    }

    if (status) {
      filters.status = status
    }

    const sorts: any = {}
    if (sortBy && (!viewMode || viewMode === 'list')) {
      if (sortBy === 'assignee') {
        sorts.playerTasks.player = { name: sortDirection }
      } else if (sortBy === 'priority') {
        sorts.priority = { weight: sortDirection }
      } else {
        sorts[sortBy] = sortDirection || 'desc'
      }
    } else {
      sorts.id = 'desc'
    }

    const [tasks, total] = await Promise.all([
      db.task.findMany({
        where: filters,
        skip,
        take: perPage,
        orderBy: sorts,
        include: {
          playerTasks: {
            include: {
              player: true
            }
          },
          priority: true,
          event: true
        }
      }),
      db.task.count({ where: filters }),
    ])

    return res.json({
      data: tasks,
      meta: {
        total,
        page,
        perPage,
        lastPage: Math.ceil(total / perPage),
      },
    })
  }

  async createTask(req: AuthRequest, res: Response) {
    const validation = createTaskSchema.safeParse(req.body)
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
      playerIds,
      description,
      dueDate,
      priorityId,
      eventId,
      status,
    } = validation.data

    let isoDueDate
    if (dueDate) {
      let _dueDate = moment(dueDate)
      const now = moment()
      if (_dueDate.isBefore(now)) {
        return res.status(400).json({ error: 'Due Date must be in the future' })
      }
      isoDueDate = moment(dueDate, 'YYYY-MM-DD').startOf('day').toISOString()
    }

    try {
      const priority = await db.taskPriority.findUnique({ where: { id: priorityId } })
      if (!priority) {
        return res.status(404).json({ error: 'Priority not found' })
      }

      // Validate event if provided
      if (eventId) {
        const event = await db.event.findUnique({ where: { id: eventId } })
        if (!event) {
          return res.status(404).json({ error: 'Event not found' })
        }
      }

      const players = await db.player.findMany({ where: { id: { in: playerIds } } })
      if (playerIds && playerIds.length > 0 && players.length != playerIds?.length) {
        return res.status(400).json({ error: 'Asignee is not valid' })
      }

      const newTask = await db.task.create({
        data: {
          name,
          description,
          dueDate: isoDueDate,
          priorityId: priority.id,
          eventId,
          status: status || 'TODO',
          createdBy: userId,
          updatedBy: userId
        },
      })

      let playerTasks: Array<any> = []
      playerIds?.forEach((playerId) => {
        playerTasks.push({
          playerId,
          taskId: newTask.id,
          createdBy: userId,
          updatedBy: userId
        })
      })

      if (playerTasks.length) {
        await db.playerTask.createMany({
          data: playerTasks,
          skipDuplicates: true,
        })
      }

      const task = await db.task.findUnique({
        where: { id: newTask.id },
        include: {
          playerTasks: {
            include: {
              player: true
            }
          },
          priority: true,
          event: true
        },
      })

      return res.status(201).json({ task })
    } catch (error) {
      console.error('Error creating task:', error)
      return res.status(500).json({ error: 'Internal Server Error' })
    }
  }

  async getPriorities(req: AuthRequest, res: Response) {
    try {
      const priorities = await db.taskPriority.findMany()

      return res.json({
        data: priorities
      });
    } catch (error) {
      console.error('Error fetching priorities:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  async updateTask(req: AuthRequest, res: Response) {
      const { id } = req.params
      const taskId = Number(id)
      if (isNaN(taskId)) {
        return res.status(400).json({ message: 'Invalid task ID' })
      }
  
      const userId = req.userId
      const validation = updateTaskSchema.safeParse(req.body)
      if (!validation.success) {
        const errors = validation.error.format()
        return res.status(400).json({ error: 'Validation error', errors })
      }
  
      const {
        name,
        playerIds,
        description,
        dueDate,
        priorityId,
        eventId,
        status,
      } = validation.data
  
      let isoDueDate
      if (dueDate) {
        let _dueDate = moment(dueDate)
        const now = moment()
        if (_dueDate.isBefore(now)) {
          return res.status(400).json({ error: 'Due Date must be in the future' })
        }
        isoDueDate = moment(dueDate, 'YYYY-MM-DD').startOf('day').toISOString()
      }
  
      try {
        const priority = await db.taskPriority.findUnique({ where: { id: priorityId } })
        if (!priority) {
          return res.status(404).json({ error: 'Priority not found' })
        }

        // Validate event if provided
        if (eventId) {
          const event = await db.event.findUnique({ where: { id: eventId } })
          if (!event) {
            return res.status(404).json({ error: 'Event not found' })
          }
        }

        const players = await db.player.findMany({ where: { id: { in: playerIds } } })
        if (playerIds && playerIds.length > 0 && players.length != playerIds?.length) {
          return res.status(400).json({ error: 'Asignee is not valid' })
        }

        const newTask = await db.task.update({
          where: ({ id: taskId, createdBy: userId }),
          data: {
            name,
            description,
            dueDate: isoDueDate,
            priorityId: priority.id,
            eventId,
            status: status || 'TODO',
            updatedBy: userId
          },
        })

        let playerTasks: Array<any> = []
        playerIds?.forEach((playerId) => {
          playerTasks.push({
            playerId,
            taskId: newTask.id,
            createdBy: userId,
            updatedBy: userId
          })
        })

        if (playerTasks.length) {
          await db.playerTask.deleteMany({
            where: ({ taskId })
          })
          await db.playerTask.createMany({
            data: playerTasks,
          })
        }

        const task = await db.task.findUnique({
          where: { id: newTask.id },
          include: {
            playerTasks: {
              include: {
                player: true
              }
            },
            priority: true,
            event: true
          },
        })
  
        return res.status(201).json({ task })
      } catch (error) {
        console.error('Error updating task:', error)
        return res.status(500).json({ error: 'Internal Server Error' })
      }
    }
}