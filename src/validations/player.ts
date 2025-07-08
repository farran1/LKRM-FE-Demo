import { z } from 'zod/v4'

export const listPlayerSchema = z.object({
  name: z.string().optional(),
  positionIds: z
    .union([
      z.coerce.number(), // single value
      z.array(z.coerce.number()), // array of values
    ])
    .transform((val) => (Array.isArray(val) ? val : [val]))
    .optional(),
  jersey: z.string().optional(),
  fromWeight: z.coerce.number().optional(),
  toWeight: z.coerce.number().optional(),
  fromHeight: z.coerce.number().optional(),
  toHeight: z.coerce.number().optional(),
  page: z.number().optional(),
  perPage: z.number().optional(),
  sortBy: z.string().optional(),
  sortDirection: z.string().optional(),
})

export const createPlayerSchema = z.object({
  name: z.string().max(255),
  eventId: z.coerce.number().optional(),
  positionId: z.coerce.number(),
  phoneNumber: z.string().min(6),
  jersey: z.string(),
  weight: z.coerce.number().positive("Weight must be a positive number").max(200),
  height: z.coerce.number().positive("Height must be a positive number").max(200),
  notes: z
    .union([
      z.string(), // single value
      z.array(z.string()), // array of values
    ])
    .transform((val) => (Array.isArray(val) ? val : [val]))
    .optional(),
  goals: z
    .union([
      z.string(), // single value
      z.array(z.string()), // array of values
    ])
    .transform((val) => (Array.isArray(val) ? val : [val]))
    .optional(),
})

export const updatePlayerSchema = z.object({
  name: z.string().max(255),
  positionId: z.coerce.number(),
  phoneNumber: z.string().min(6),
  jersey: z.string(),
  weight: z.coerce.number().positive("Weight must be a positive number").max(200),
  height: z.coerce.number().positive("Height must be a positive number").max(200),
})

export const updateNoteSchema = z.object({
  notes: z
    .union([
      z.string(), // single value
      z.array(z.string()), // array of values
    ])
    .transform((val) => (Array.isArray(val) ? val : [val])),
})

export const updateGoalSchema = z.object({
  goals: z
    .union([
      z.string(), // single value
      z.array(z.string()), // array of values
    ])
    .transform((val) => (Array.isArray(val) ? val : [val])),
})

export const validateImportPlayerSchema = z.object({
  importId: z.string(),
})

export const importPlayerSchema = z.object({
  importId: z.string(),
  option: z.string()
})