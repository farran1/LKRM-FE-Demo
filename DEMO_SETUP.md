# 🏀 LKMR Demo Setup - Local Storage Mode

This application now runs in **Local Storage Demo Mode** for offline demonstrations and testing. All data is stored in your browser's localStorage instead of requiring a backend database.

## 🚀 Features

- **Offline Functionality**: Works completely offline, no backend required
- **Persistent Data**: All changes are saved locally and persist between sessions
- **Event-Task Integration**: Tasks can be linked to specific events (like the Eagles vs Hawks game)
- **Real-time Updates**: Data updates immediately across all components
- **Demo Management**: Easy reset and clear functionality

## 📊 What's Included

### Default Demo Data:
- **2 Events**: Eagles vs Hawks (Game), Practice Session
- **5 Tasks**: Event-specific game tasks + general tasks
- **4 Players**: Sample players with positions
- **3 Priorities**: High, Medium, Low
- **4 Positions**: Forward, Goalkeeper, Defender, Midfielder
- **3 Event Types**: Practice, Game, Meeting

### Fully Functional Features:
- ✅ **Gameday Checklist Module** with real task counts for specific events
- ✅ **Priority Task Filtering** - view tasks by priority (High/Medium/Low)
- ✅ **Event-specific Tasks** - tasks linked to specific games/events
- ✅ **Task Management** - create, update, delete tasks
- ✅ **Player Management** - view and manage players
- ✅ **Event Details** - view event information and player lists
- ✅ **Data Persistence** - all changes saved locally

## 🛠️ Usage

### Running the Demo:
1. Start the development server: `npm run dev`
2. Navigate to `/dashboard3` to see the main demo page
3. Demo data is automatically initialized on first load

### Managing Demo Data:
- **Reset to Defaults**: Use the "Reset to Defaults" button to restore original demo data
- **Clear All Data**: Use "Clear All Data" to wipe everything (refresh page to get defaults back)
- **View Data Stats**: See current counts of events, tasks, players, etc.

### Key Pages to Test:
- `/dashboard3` - Main demo dashboard with modules and data manager
- `/tasks` - Full tasks page with filtering and management
- `/events` - Events page with event details
- `/players` - Players management page

## 🔧 Technical Details

### Architecture:
- **Local Storage Service** (`src/services/local-storage.ts`): Core data management
- **Local API Service** (`src/services/local-api.ts`): Simulates backend API responses
- **API Wrapper** (`src/services/api.ts`): Routes requests to local storage
- **MSW Disabled**: Mock Service Worker is disabled in favor of localStorage

### Switching Back to Backend:
To use the real backend instead of localStorage:
1. Open `src/services/api.ts`
2. Change `USE_LOCAL_STORAGE = true` to `USE_LOCAL_STORAGE = false`
3. Set up your database and backend services
4. Update environment variables for database connection

## 🎯 Perfect for:

- **Client Demonstrations**: Show features without backend setup
- **Offline Development**: Work on UI/UX without database dependencies
- **Feature Testing**: Test new components with realistic data
- **Presentations**: Reliable demo that doesn't depend on network
- **Rapid Prototyping**: Quickly test ideas with persistent data

## 📋 Event-Task Integration

The demo showcases a complete event-task system:

### Eagles vs Hawks Game (Event ID: 1):
- **Not Started**: 2 tasks (Set up equipment, Check uniforms)
- **In Progress**: 1 task (Team warm-up)
- **Completed**: 1 task (Review game plan)

### General Tasks:
- Tasks not linked to specific events (like "Update player stats")

### Interactive Features:
- Click status buttons in Gameday Checklist → View filtered tasks
- Click event details → View full event information with players
- Click add button → Create new tasks (can be linked to events)
- Navigate to tasks page → See all tasks with event filtering

## 🔄 Data Persistence

All data changes are immediately saved to localStorage:
- **Create tasks** → Automatically saved
- **Update task status** → Persists across sessions
- **Modify priorities** → Saved locally
- **Browser refresh** → Data remains intact
- **Close/reopen browser** → Data still there

## 🎨 UI Components

The demo includes fully functional components:
- **Gameday Checklist Module**: Real-time status counts, event details, task filtering
- **Priority Tasks Modal**: Professional table with filtering and navigation
- **Event Detail Modal**: Complete event information with players and sections
- **Demo Data Manager**: Easy reset and management interface

---

**Ready for offline demos! 🚀** No database, no backend, no network required - just pure frontend functionality with persistent local data. 
 