import { z } from 'zod'

export const createEventTypeSchema = z.object({
  name: z.string().max(255),
  color: z.string().max(7),
  txtColor: z.string().max(7),
})