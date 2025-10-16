import { z } from 'zod'

// Common validation schemas
export const commonSchemas = {
  // ID validation
  id: z.number().int().positive(),
  idString: z.string().regex(/^\d+$/).transform(val => parseInt(val)),
  
  // Email validation
  email: z.string().email().max(255),
  
  // Name validation
  name: z.string().min(1).max(100).trim(),
  firstName: z.string().min(1).max(50).trim(),
  lastName: z.string().min(1).max(50).trim(),
  
  // Text validation
  description: z.string().max(1000).optional(),
  longText: z.string().max(5000).optional(),
  
  // Date validation
  date: z.string().datetime().optional(),
  dateRequired: z.string().datetime(),
  
  // Number validation
  positiveNumber: z.number().positive(),
  nonNegativeNumber: z.number().min(0),
  
  // Enum validations
  priority: z.enum(['low', 'medium', 'high']).optional(),
  status: z.enum(['active', 'inactive', 'pending', 'completed']).optional(),
  
  // URL validation
  url: z.string().url().optional(),
  
  // Phone validation
  phone: z.string().regex(/^[\+]?[1-9][\d]{0,15}$/).optional(),
  
  // Pagination
  pagination: z.object({
    page: z.number().int().min(1).default(1),
    limit: z.number().int().min(1).max(100).default(10),
    offset: z.number().int().min(0).optional()
  })
}

// Player validation schemas
export const playerSchemas = {
  create: z.object({
    first_name: commonSchemas.firstName,
    last_name: commonSchemas.lastName,
    jersey_number: z.string().max(10).optional(),
    position: z.string().max(50).optional(),
    height: z.number().positive().optional(),
    weight: z.number().positive().optional(),
    class_year: z.enum(['freshman', 'sophomore', 'junior', 'senior']).optional(),
    email: commonSchemas.email.optional(),
    phone: commonSchemas.phone.optional()
  }),
  
  update: z.object({
    first_name: commonSchemas.firstName.optional(),
    last_name: commonSchemas.lastName.optional(),
    jersey_number: z.string().max(10).optional(),
    position: z.string().max(50).optional(),
    height: z.number().positive().optional(),
    weight: z.number().positive().optional(),
    class_year: z.enum(['freshman', 'sophomore', 'junior', 'senior']).optional(),
    email: commonSchemas.email.optional(),
    phone: commonSchemas.phone.optional(),
    is_active: z.boolean().optional()
  }),
  
  search: z.object({
    search: z.string().max(100).optional(),
    position: z.string().max(50).optional(),
    class_year: z.enum(['freshman', 'sophomore', 'junior', 'senior']).optional(),
    sortBy: z.string().max(50).optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
    ...commonSchemas.pagination.shape
  })
}

// Event validation schemas
export const eventSchemas = {
  create: z.object({
    name: commonSchemas.name,
    description: commonSchemas.description,
    eventTypeId: commonSchemas.id,
    startTime: commonSchemas.dateRequired,
    endTime: commonSchemas.date,
    location: z.enum(['HOME', 'AWAY']).optional(),
    venue: z.string().max(200).optional(),
    oppositionTeam: z.string().max(100).optional(),
    notes: commonSchemas.description
  }),
  
  update: z.object({
    name: commonSchemas.name.optional(),
    description: commonSchemas.description,
    eventTypeId: commonSchemas.id.optional(),
    startTime: commonSchemas.dateRequired.optional(),
    endTime: commonSchemas.date,
    location: z.enum(['HOME', 'AWAY']).optional(),
    venue: z.string().max(200).optional(),
    oppositionTeam: z.string().max(100).optional(),
    notes: commonSchemas.description
  }),
  
  search: z.object({
    search: z.string().max(100).optional(),
    eventTypeId: commonSchemas.id.optional(),
    startDate: commonSchemas.date,
    endDate: commonSchemas.date,
    location: z.enum(['HOME', 'AWAY']).optional(),
    ...commonSchemas.pagination.shape
  })
}

// Expense validation schemas
export const expenseSchemas = {
  create: z.object({
    merchant: z.string().min(1).max(200).trim(),
    amount: z.number().positive(),
    category: z.string().max(100).optional(),
    date: commonSchemas.dateRequired,
    eventId: commonSchemas.id.optional(),
    budgetId: commonSchemas.id.optional(),
    description: commonSchemas.description,
    receiptUrl: commonSchemas.url
  }),
  
  update: z.object({
    merchant: z.string().min(1).max(200).trim().optional(),
    amount: z.number().positive().optional(),
    category: z.string().max(100).optional(),
    date: commonSchemas.dateRequired.optional(),
    eventId: commonSchemas.id.optional(),
    budgetId: commonSchemas.id.optional(),
    description: commonSchemas.description,
    receiptUrl: commonSchemas.url
  }),
  
  search: z.object({
    merchant: z.string().max(100).optional(),
    description: z.string().max(100).optional(),
    budgetId: commonSchemas.id.optional(),
    eventId: commonSchemas.id.optional(),
    startDate: commonSchemas.date,
    endDate: commonSchemas.date,
    minAmount: z.number().min(0).optional(),
    maxAmount: z.number().min(0).optional(),
    ...commonSchemas.pagination.shape
  })
}

// Task validation schemas
export const taskSchemas = {
  create: z.object({
    name: z.string().min(1).max(200).trim(),
    description: commonSchemas.description,
    dueDate: commonSchemas.date,
    priorityId: commonSchemas.id,
    eventId: commonSchemas.id.optional(),
    assigneeId: z.string().max(100).optional(),
    status: z.enum(['active', 'inactive', 'pending', 'completed']).default('active')
  }),
  
  update: z.object({
    name: z.string().min(1).max(200).trim().optional(),
    description: commonSchemas.description,
    dueDate: commonSchemas.date,
    priorityId: commonSchemas.id.optional(),
    eventId: commonSchemas.id.optional(),
    assigneeId: z.string().max(100).optional(),
    status: z.enum(['active', 'inactive', 'pending', 'completed']).optional()
  }),
  
  search: z.object({
    search: z.string().max(100).optional(),
    status: commonSchemas.status,
    priorityId: commonSchemas.id.optional(),
    assigneeId: z.string().max(100).optional(),
    dueDate: commonSchemas.date,
    ...commonSchemas.pagination.shape
  })
}

// Goal validation schemas
export const goalSchemas = {
  create: z.object({
    title: z.string().min(1).max(255).trim(),
    description: z.string().max(1000).optional(),
    target_value: z.number().positive().optional(),
    priority: z.enum(['low', 'medium', 'high']).optional(),
    deadline: commonSchemas.date
  }),
  
  update: z.object({
    title: z.string().min(1).max(255).trim().optional(),
    description: z.string().max(1000).optional(),
    target_value: z.number().positive().optional(),
    priority: z.enum(['low', 'medium', 'high']).optional(),
    deadline: commonSchemas.date,
    isAchieved: z.boolean().optional()
  })
}

// Budget validation schemas
export const budgetSchemas = {
  create: z.object({
    name: z.string().min(1).max(200).trim(),
    amount: z.number().positive(),
    period: z.string().max(50),
    description: commonSchemas.description,
    categoryId: commonSchemas.id.optional(),
    season: z.string().max(20).default('2024-25'),
    autoRepeat: z.boolean().default(false)
  }),
  
  update: z.object({
    name: z.string().min(1).max(200).trim().optional(),
    amount: z.number().positive().optional(),
    period: z.string().max(50).optional(),
    description: commonSchemas.description,
    categoryId: commonSchemas.id.optional(),
    season: z.string().max(20).optional(),
    autoRepeat: z.boolean().optional()
  })
}

// Live game validation schemas
export const liveGameSchemas = {
  createSession: z.object({
    event_id: commonSchemas.id,
    game_id: commonSchemas.id.optional(),
    session_key: z.string().max(100).optional()
  }),
  
  createEvent: z.object({
    session_id: commonSchemas.id,
    player_id: commonSchemas.id.optional(),
    event_type: z.string().min(1).max(50),
    event_value: z.number().int().optional(),
    quarter: z.number().int().min(1).max(4),
    is_opponent_event: z.boolean().default(false),
    opponent_jersey: z.string().max(10).optional(),
    metadata: z.record(z.string(), z.any()).optional()
  }),
  
  updateEvent: z.object({
    event_type: z.string().min(1).max(50).optional(),
    event_value: z.number().int().optional(),
    quarter: z.number().int().min(1).max(4).optional(),
    is_opponent_event: z.boolean().optional(),
    opponent_jersey: z.string().max(10).optional(),
    metadata: z.record(z.string(), z.any()).optional()
  })
}

// Quick notes validation schemas
export const quickNoteSchemas = {
  create: z.object({
    content: z.string().min(1).max(2000).trim(),
    color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
    position_x: z.number().int().optional(),
    position_y: z.number().int().optional(),
    is_pinned: z.boolean().default(false)
  }),
  
  update: z.object({
    content: z.string().min(1).max(2000).trim().optional(),
    color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
    position_x: z.number().int().optional(),
    position_y: z.number().int().optional(),
    is_pinned: z.boolean().optional()
  })
}

// File upload validation schemas
export const fileSchemas = {
  upload: z.object({
    file: z.instanceof(File),
    context: z.string().max(100),
    metadata: z.record(z.string(), z.any()).optional()
  })
}

// Stats validation schemas
export const statsSchemas = {
  timeRange: z.object({
    timeRange: z.enum(['all', 'season', 'last_30_days', 'last_7_days', 'custom', 'selectGames']),
    startDate: commonSchemas.date.optional(),
    endDate: commonSchemas.date.optional(),
    gameIds: z.array(commonSchemas.id).optional(),
    season: z.string().max(20).default('2024-25')
  }),
  
  playerStats: z.object({
    playerId: commonSchemas.id.optional(),
    timeRange: z.enum(['all', 'season', 'last_30_days', 'last_7_days', 'custom']),
    startDate: commonSchemas.date.optional(),
    endDate: commonSchemas.date.optional(),
    season: z.string().max(20).default('2024-25')
  })
}

// Helper function to validate and sanitize input
export function validateAndSanitize<T>(schema: z.ZodSchema<T>, data: unknown): T {
  return schema.parse(data)
}

// Helper function for safe parsing with error handling
export function safeParse<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; error: string } {
  try {
    const result = schema.safeParse(data)
    if (result.success) {
      return { success: true, data: result.data }
    } else {
      const errs = (result as any).error?.issues || (result as any).error?.errors || []
      const message = Array.isArray(errs) ? errs.map((e: any) => `${(e.path||[]).join('.')}: ${e.message}`).join(', ') : 'Validation failed'
      return { 
        success: false, 
        error: message
      }
    }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Validation failed'
    }
  }
}
