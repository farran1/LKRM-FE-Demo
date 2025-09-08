# Live Statistics Tracking Flow

## Overview
This document describes the updated flow for coaches to track live statistics during team events.

## New Flow Architecture

### 1. Event Selection
- **Page**: `/stats-tracking`
- **Component**: `EventSelector`
- **Purpose**: Allows coaches to select which event they want to track stats for
- **Features**:
  - Dropdown selection of available events
  - Event details display (name, date, venue, opponent)
  - Create new event option
  - Search and filter capabilities

### 2. Event Confirmation
- **Step**: Review & Confirm
- **Purpose**: Coaches review selected event details before starting tracking
- **Features**:
  - Event summary display
  - Confirmation button to proceed
  - Progress indicator

### 3. Live Stat Tracking
- **Page**: Integrated statistics component
- **Purpose**: Full-featured live statistics tracking
- **Features**:
  - Game clock and controls
  - Player statistics tracking
  - Real-time updates
  - Export capabilities

## API Endpoints

### Game Statistics
- `GET /api/game-stats?eventId={id}` - Get stats for an event
- `POST /api/game-stats` - Create/update game stat
- `PUT /api/game-stats` - Update existing stat
- `DELETE /api/game-stats?id={id}` - Delete stat

### Games
- `GET /api/games?eventId={id}` - Get games for an event
- `POST /api/games` - Create new game
- `PUT /api/games` - Update game
- `DELETE /api/games?id={id}` - Delete game

### Event Players
- `GET /api/events/{id}/players` - Get players for an event
- `POST /api/events/{id}/players` - Add player to event

## Database Schema

The system uses existing tables:
- `events` - Event information
- `games` - Games within events
- `game_stats` - Individual statistics
- `players` - Player information
- `player_events` - Player-event relationships

## User Experience

### Coach Workflow
1. Navigate to "Live Stats Tracking" in the Performance menu
2. Select an event from the dropdown
3. Review event details and confirm
4. Start live stat tracking
5. Use the comprehensive stat tracker interface

### Benefits
- **Clear Flow**: Step-by-step process prevents confusion
- **Event Context**: All stats are properly associated with specific events
- **Flexibility**: Can switch between events or create new ones
- **Integration**: Seamlessly connects events with statistics tracking

## Technical Implementation

### Components
- `EventSelector` - Reusable event selection component
- `StatsTrackingPage` - Main workflow page
- `Statistics` - Enhanced statistics component with event context

### State Management
- Event selection state
- Step progression
- Statistics context

### Navigation
- Updated menu structure
- Clear progression indicators
- Back navigation support

## Future Enhancements

1. **Player Loading**: Automatically load players associated with selected events
2. **Game Creation**: Allow coaches to create games within events
3. **Real-time Sync**: WebSocket integration for live updates
4. **Mobile Support**: Responsive design for mobile devices
5. **Offline Support**: Local storage for offline tracking

## Usage Instructions

1. **For Coaches**:
   - Use the "Live Stats Tracking" menu item
   - Follow the step-by-step process
   - Ensure events are created before tracking

2. **For Developers**:
   - The `EventSelector` component is reusable
   - Statistics component accepts `eventId` prop
   - API endpoints follow RESTful conventions
