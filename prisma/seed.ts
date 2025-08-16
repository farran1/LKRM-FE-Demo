import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Create default positions
  const positions = await Promise.all([
    prisma.position.upsert({
      where: { name: 'Point Guard' },
      update: {},
      create: {
        name: 'Point Guard',
        abbreviation: 'PG',
        description: 'Primary ball handler and playmaker',
        createdBy: 0,
        updatedBy: 0
      }
    }),
    prisma.position.upsert({
      where: { name: 'Shooting Guard' },
      update: {},
      create: {
        name: 'Shooting Guard',
        abbreviation: 'SG',
        description: 'Primary perimeter scorer',
        createdBy: 0,
        updatedBy: 0
      }
    }),
    prisma.position.upsert({
      where: { name: 'Small Forward' },
      update: {},
      create: {
        name: 'Small Forward',
        abbreviation: 'SF',
        description: 'Versatile wing player',
        createdBy: 0,
        updatedBy: 0
      }
    }),
    prisma.position.upsert({
      where: { name: 'Power Forward' },
      update: {},
      create: {
        name: 'Power Forward',
        abbreviation: 'PF',
        description: 'Strong interior player',
        createdBy: 0,
        updatedBy: 0
      }
    }),
    prisma.position.upsert({
      where: { name: 'Center' },
      update: {},
      create: {
        name: 'Center',
        abbreviation: 'C',
        description: 'Primary interior presence',
        createdBy: 0,
        updatedBy: 0
      }
    })
  ])

  // Create default event types
  const eventTypes = await Promise.all([
    prisma.eventType.upsert({
      where: { name: 'Practice' },
      update: {},
      create: {
        name: 'Practice',
        color: '#2196f3',
        txtColor: '#ffffff',
        icon: '⚽',
        createdBy: 0,
        updatedBy: 0
      }
    }),
    prisma.eventType.upsert({
      where: { name: 'Game' },
      update: {},
      create: {
        name: 'Game',
        color: '#4ecdc4',
        txtColor: '#ffffff',
        icon: '🏀',
        createdBy: 0,
        updatedBy: 0
      }
    }),
    prisma.eventType.upsert({
      where: { name: 'Scrimmage' },
      update: {},
      create: {
        name: 'Scrimmage',
        color: '#ff9800',
        txtColor: '#ffffff',
        icon: '🏃',
        createdBy: 0,
        updatedBy: 0
      }
    }),
    prisma.eventType.upsert({
      where: { name: 'Team Meeting' },
      update: {},
      create: {
        name: 'Team Meeting',
        color: '#4caf50',
        txtColor: '#ffffff',
        icon: '📋',
        createdBy: 0,
        updatedBy: 0
      }
    })
  ])

  // Create default task priorities
  const priorities = await Promise.all([
    prisma.taskPriority.upsert({
      where: { name: 'High' },
      update: {},
      create: {
        name: 'High',
        weight: 1,
        color: '#ff4d4f',
        createdBy: 0,
        updatedBy: 0
      }
    }),
    prisma.taskPriority.upsert({
      where: { name: 'Medium' },
      update: {},
      create: {
        name: 'Medium',
        weight: 2,
        color: '#faad14',
        createdBy: 0,
        updatedBy: 0
      }
    }),
    prisma.taskPriority.upsert({
      where: { name: 'Low' },
      update: {},
      create: {
        name: 'Low',
        weight: 3,
        color: '#52c41a',
        createdBy: 0,
        updatedBy: 0
      }
    })
  ])

  // Create default budget categories
  const budgetCategories = await Promise.all([
    prisma.budgetCategory.upsert({
      where: { name: 'Equipment & Uniforms' },
      update: {},
      create: {
        name: 'Equipment & Uniforms',
        description: 'Basketball equipment, uniforms, and gear',
        color: '#1890ff',
        createdBy: 0,
        updatedBy: 0
      }
    }),
    prisma.budgetCategory.upsert({
      where: { name: 'Travel & Transportation' },
      update: {},
      create: {
        name: 'Travel & Transportation',
        description: 'Team travel expenses and transportation',
        color: '#52c41a',
        createdBy: 0,
        updatedBy: 0
      }
    }),
    prisma.budgetCategory.upsert({
      where: { name: 'Tournament & League Fees' },
      update: {},
      create: {
        name: 'Tournament & League Fees',
        description: 'Registration and participation fees',
        color: '#faad14',
        createdBy: 0,
        updatedBy: 0
      }
    }),
    prisma.budgetCategory.upsert({
      where: { name: 'Food & Drink' },
      update: {},
      create: {
        name: 'Food & Drink',
        description: 'Team meals and hydration',
        color: '#722ed1',
        createdBy: 0,
        updatedBy: 0
      }
    })
  ])

  // Create default season
  const currentSeason = await prisma.season.upsert({
    where: { name: '2024-25' },
    update: {},
    create: {
      name: '2024-25',
      startDate: new Date('2024-11-01'),
      endDate: new Date('2025-03-31'),
      isActive: true,
      description: 'Current basketball season',
      createdBy: 0,
      updatedBy: 0
    }
  })

  console.log('✅ Database seeded successfully!')
  console.log(`📍 Created ${positions.length} positions`)
  console.log(`📅 Created ${eventTypes.length} event types`)
  console.log(`⚡ Created ${priorities.length} task priorities`)
  console.log(`💰 Created ${budgetCategories.length} budget categories`)
  console.log(`🏀 Created season: ${currentSeason.name}`)
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })