// Mock Prisma client for frontend static export
// import { PrismaClient } from '@prisma/client'

// Mock database operations
const mockDb = {
  user: {
    findUnique: async (params: any) => ({ id: 1, email: 'mock@example.com', username: 'mockuser', password: 'hashedpassword' }),
    create: async (params: any) => ({ id: 1, ...params.data }),
    update: async (params: any) => ({ id: 1, ...params.data }),
    findMany: async (params?: any) => [],
    count: async (params?: any) => 0
  },
  player: {
    findUnique: async (params: any) => ({ id: 1, name: 'Mock Player', positionId: 1 }),
    create: async (params: any) => ({ id: 1, ...params.data }),
    update: async (params: any) => ({ id: 1, ...params.data }),
    findMany: async (params?: any) => [],
    findFirst: async (params: any) => ({ id: 1, name: 'Mock Position' }),
    count: async (params?: any) => 0,
    deleteMany: async (params?: any) => ({ count: 1 }),
    createMany: async (params: any) => ({ count: params.data.length })
  },
  volunteer: {
    findUnique: async (params: any) => ({ id: 1, name: 'Mock Volunteer' }),
    create: async (params: any) => ({ id: 1, ...params.data }),
    update: async (params: any) => ({ id: 1, ...params.data }),
    findMany: async (params?: any) => [],
    findFirst: async (params: any) => ({ id: 1, name: 'Mock Volunteer' }),
    count: async (params?: any) => 0
  },
  event: {
    findUnique: async (params: any) => ({ id: 1, name: 'Mock Event' }),
    create: async (params: any) => ({ id: 1, ...params.data }),
    update: async (params: any) => ({ id: 1, ...params.data }),
    findMany: async (params?: any) => [],
    count: async (params?: any) => 0
  },
  position: {
    findUnique: async (params: any) => ({ id: 1, name: 'Mock Position' }),
    create: async (params: any) => ({ id: 1, ...params.data }),
    update: async (params: any) => ({ id: 1, ...params.data }),
    findMany: async (params?: any) => [],
    findFirst: async (params: any) => ({ id: 1, name: 'Mock Position' }),
    count: async (params?: any) => 0
  },
  profile: {
    findUnique: async (params: any) => ({ id: 1, firstName: 'Mock', lastName: 'User' }),
    create: async (params: any) => ({ id: 1, ...params.data }),
    update: async (params: any) => ({ id: 1, ...params.data }),
    findMany: async (params?: any) => [],
    count: async (params?: any) => 0
  },
  playerEvent: {
    create: async (params: any) => ({ id: 1, ...params.data }),
    findMany: async (params?: any) => [],
    count: async (params?: any) => 0,
    deleteMany: async (params?: any) => ({ count: 1 })
  },
  volunteerEvent: {
    create: async (params: any) => ({ id: 1, ...params.data }),
    findMany: async (params?: any) => [],
    count: async (params?: any) => 0,
    deleteMany: async (params?: any) => ({ count: 1 })
  },
  playerNote: {
    create: async (params: any) => ({ id: 1, ...params.data }),
    createMany: async (params: any) => ({ count: params.data.length }),
    findMany: async (params?: any) => [],
    deleteMany: async (params?: any) => ({ count: 1 })
  },
  playerGoal: {
    create: async (params: any) => ({ id: 1, ...params.data }),
    createMany: async (params: any) => ({ count: params.data.length }),
    findMany: async (params?: any) => [],
    deleteMany: async (params?: any) => ({ count: 1 }),
    count: async (params?: any) => 0
  },
  playerImport: {
    create: async (params: any) => ({ id: 1, ...params.data }),
    createMany: async (params: any) => ({ count: params.data.length }),
    findMany: async (params?: any) => [],
    deleteMany: async (params?: any) => ({ count: 1 }),
    count: async (params?: any) => 0
  },
  eventType: {
    findUnique: async (params: any) => ({ id: 1, name: 'Mock Event Type' }),
    create: async (params: any) => ({ id: 1, ...params.data }),
    update: async (params: any) => ({ id: 1, ...params.data }),
    findMany: async (params?: any) => [],
    createMany: async (params: any) => ({ count: params.data.length }),
    count: async (params?: any) => 0
  },
  task: {
    findUnique: async (params: any) => ({ id: 1, name: 'Mock Task', description: 'Mock task description', priorityId: 1, status: 'TODO' }),
    create: async (params: any) => ({ id: 1, ...params.data }),
    update: async (params: any) => ({ id: 1, ...params.data }),
    findMany: async (params?: any) => [],
    count: async (params?: any) => 0
  },
  taskPriority: {
    findUnique: async (params: any) => ({ id: 1, name: 'High', weight: 3 }),
    findMany: async (params?: any) => [{ id: 1, name: 'High', weight: 3 }, { id: 2, name: 'Medium', weight: 2 }, { id: 3, name: 'Low', weight: 1 }]
  },
  playerTask: {
    create: async (params: any) => ({ id: 1, ...params.data }),
    createMany: async (params: any) => ({ count: params.data.length }),
    findMany: async (params?: any) => [],
    deleteMany: async (params?: any) => ({ count: 1 })
  },
  $disconnect: async () => Promise.resolve()
};

const globalForPrisma = globalThis as unknown as {
  prisma: typeof mockDb | undefined
}

export const db =
  globalForPrisma.prisma ??
  mockDb

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db