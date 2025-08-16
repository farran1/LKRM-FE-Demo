# Next.js Admin Dashboard

A comprehensive basketball coaching management platform built with Next.js 15, Prisma, PostgreSQL, and TypeScript.

## Features

- 🏀 **Basketball Team Management**: Complete player roster and statistics tracking
- 📅 **Event Management**: Games, practices, meetings with calendar integration
- ✅ **Task Management**: Team tasks with priority levels and assignments
- 💰 **Budget & Expense Tracking**: Financial management for team operations
- 📊 **Statistics Dashboard**: Comprehensive analytics and performance tracking
- 🔴 **Live Stat Tracker**: Real-time game statistics and monitoring
- 🚀 **Next.js 15** with App Router and TypeScript
- 🗄️ **PostgreSQL** with Prisma ORM
- 💅 **Ant Design** for professional UI components
- 📱 **Mobile-responsive** design with dark theme

## Prerequisites

- Node.js v18.0.0 or later
- PostgreSQL database
- npm or yarn package manager

## Getting Started

1. **Clone the repository:**
```bash
git clone <repository-url>
cd <project-directory>
```

2. **Install dependencies:**
```bash
npm install
```

3. **Set up environment variables:**
```bash
cp .env.example .env.local
# Edit .env.local with your database credentials and other settings
```

4. **Set up the database:**
```bash
# Start PostgreSQL (using Docker)
docker-compose up -d lkmr_db

# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:migrate

# Seed the database with default data
npm run db:seed
```

5. **Run the development server:**
```bash
npm run dev
```

6. **Open your browser:**
Navigate to [http://localhost:3000](http://localhost:3000) to access the application.

## Project Structure

```
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Protected routes
│   │   ├── dashboard/     # Main dashboard
│   │   ├── events/        # Event management
│   │   ├── players/       # Player management
│   │   ├── tasks/         # Task management
│   │   ├── budgets/       # Budget management
│   │   └── stats-*/       # Statistics dashboards
│   └── login/             # Authentication
├── src/
│   ├── components/        # Reusable React components
│   ├── controllers/       # API route controllers
│   ├── lib/              # Utility functions and configurations
│   ├── services/         # Database and external services
│   ├── store/            # Zustand state management
│   ├── utils/            # Helper functions
│   └── validations/      # Zod validation schemas
├── prisma/
│   ├── schema.prisma     # Database schema
│   ├── seed.ts          # Database seeding
│   └── migrations/      # Database migrations
└── public/              # Static assets
```

## Available Scripts

### Development
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Database
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema changes to database
- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Seed database with default data
- `npm run db:studio` - Open Prisma Studio
- `npm run db:reset` - Reset database (⚠️ destructive)

### Deployment
- `npm run export` - Export static site
- `npm run deploy` - Build for deployment

## Database Schema

The application uses PostgreSQL with Prisma ORM. Key entities include:

### Core Entities
- **Users & Profiles**: Authentication and user management
- **Players**: Team roster with positions and statistics
- **Events**: Games, practices, meetings with scheduling
- **Tasks**: Team task management with priorities and assignments

### Basketball-Specific
- **Positions**: Point Guard, Shooting Guard, Small Forward, Power Forward, Center
- **Game Stats**: Comprehensive basketball statistics tracking
- **Seasons**: Multi-season data management

### Financial Management
- **Budget Categories**: Equipment, Travel, Tournament Fees, Food & Drink
- **Budgets**: Budget planning and tracking
- **Expenses**: Expense tracking with receipt management

### System Features
- **Notifications**: User notification system
- **Settings**: User preferences and configuration
- **Audit Logs**: Complete audit trail for security

## Key Features

### 🏀 Team Management
- **Player Roster**: Complete player profiles with positions, stats, and photos
- **Player Development**: Goals, notes, and progress tracking
- **Position Management**: Basketball-specific position tracking

### 📅 Event & Schedule Management
- **Event Types**: Games, practices, scrimmages, meetings
- **Calendar Integration**: Visual calendar with event management
- **Event Planning**: Venue, opposition team, and logistics tracking

### ✅ Task Management
- **Priority Levels**: High, Medium, Low priority tasks
- **Assignment System**: Assign tasks to players or coaches
- **Progress Tracking**: TODO, In Progress, Done status tracking
- **Event Integration**: Link tasks to specific events

### 💰 Financial Management
- **Budget Planning**: Create and manage team budgets
- **Expense Tracking**: Track all team-related expenses
- **Receipt Management**: Upload and organize receipts
- **Financial Reporting**: Budget vs actual spending analysis

### 📊 Statistics & Analytics
- **Live Stat Tracker**: Real-time game statistics entry
- **Performance Analytics**: Advanced statistical analysis
- **Player Development**: Individual player progress tracking
- **Team Analytics**: Comprehensive team performance metrics

## Development Setup

### Local Development
1. Start the database: `docker-compose up -d lkmr_db`
2. Run migrations: `npm run db:migrate`
3. Seed data: `npm run db:seed`
4. Start development: `npm run dev`

### Database Management
- Use `npm run db:studio` to open Prisma Studio for database management
- Use `npm run db:reset` to completely reset the database (⚠️ destructive)
- Migrations are automatically generated when you modify `prisma/schema.prisma`

## API Endpoints

The application provides RESTful API endpoints for all major functionality:

### Authentication
- `POST /api/login` - User authentication
- `GET /api/me` - Get current user profile

### Events
- `GET /api/events` - List events with filtering
- `POST /api/events` - Create new event
- `GET /api/events/:id` - Get event details
- `PUT /api/events/:id` - Update event

### Players
- `GET /api/players` - List players with filtering
- `POST /api/players` - Create new player
- `GET /api/players/:id` - Get player details
- `PUT /api/players/:id` - Update player

### Tasks
- `GET /api/tasks` - List tasks with filtering
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/:id` - Update task

### Statistics
- `GET /api/stats/team` - Team statistics
- `GET /api/stats/player/:id` - Player statistics
- `POST /api/stats/game` - Submit game statistics

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Deployment

### Docker Deployment
```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f lkmr_be
```

### Manual Deployment
1. Set up PostgreSQL database
2. Configure environment variables
3. Run database migrations
4. Build and start the application

## License

This project is licensed under the MIT License.