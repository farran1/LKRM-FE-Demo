import { z } from 'zod/v4'

export const listTaskSchema = z.object({
  viewMode: z.string().optional(),
  name: z.string().optional(),
  dueDate: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  playerIds: z
    .union([
      z.coerce.number(),
      z.array(z.coerce.number()),
    ])
    .transform((val) => (Array.isArray(val) ? val : [val]))
    .optional(),
  priorityId: z.coerce.number().optional(),
  eventId: z.coerce.number().optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']).optional(),
  page: z.number().optional(),
  perPage: z.number().optional(),
  sortBy: z.string().optional(),
  sortDirection: z.string().optional(),
})

export const createTaskSchema = z.object({
  name: z.string().max(255),
  dueDate: z.iso.date().optional(),
  description: z.string().max(2000).optional(),
  playerIds: z
    .union([
      z.coerce.number(),
      z.array(z.coerce.number()),
    ])
    .transform((val) => (Array.isArray(val) ? val : [val]))
    .optional(),
  priorityId: z.number(),
  eventId: z.number().optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']),
})

export const updateTaskSchema = z.object({
  name: z.string().max(255),
  dueDate: z.iso.date().optional(),
  description: z.string().max(2000).optional(),
  playerIds: z
    .union([
      z.coerce.number(),
      z.array(z.coerce.number()),
    ])
    .transform((val) => (Array.isArray(val) ? val : [val]))
    .optional(),
  priorityId: z.number(),
  eventId: z.number().optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']),
})