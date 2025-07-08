import { z } from 'zod/v4'

export const listEventSchema = z.object({
  name: z.string().optional(),
  startDate: z.iso.date().optional(),
  endDate: z.iso.date().optional(),
  eventTypeIds: z
    .union([
      z.coerce.number(), // single value
      z.array(z.coerce.number()), // array of values
    ])
    .transform((val) => (Array.isArray(val) ? val : [val]))
    .optional(),
  location: z.enum(['HOME', 'AWAY']).optional(),
  venue: z.string().optional(),
  page: z.number().optional(),
  perPage: z.number().optional(),
  sortBy: z.string().optional(),
  sortDirection: z.string().optional(),
})

export const createEventSchema = z.object({
  name: z.string().max(255),
  eventTypeId: z.number(),
  startTime: z.string(),
  endTime: z.string().optional(),
  isRepeat: z.boolean().optional(),
  occurence: z.number().optional(),
  location: z.enum(["HOME", "AWAY"]),
  venue: z.string(),
  oppositionTeam: z.string().optional()
})

export const updateEventSchema = z.object({
  name: z.string().max(255),
  eventTypeId: z.number(),
  startTime: z.string(),
  endTime: z.string().optional(),
  isRepeat: z.boolean().optional(),
  occurence: z.number().optional(),
  location: z.enum(["HOME", "AWAY"]),
  venue: z.string(),
  oppositionTeam: z.string().optional()
})