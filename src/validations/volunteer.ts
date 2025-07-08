import { z } from 'zod'

export const createVolunteerSchema = z.object({
  name: z.string().max(255),
  eventId: z.coerce.number(),
  phoneNumber: z.string().min(6),
})