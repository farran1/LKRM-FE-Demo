// Local storage service for offline demo data
export interface LocalEvent {
  id: number;
  name: string;
  startTime: string;
  endTime?: string;
  eventTypeId: number;
  eventType: {
    id: number;
    name: string;
    color: string;
    txtColor: string;
  };
  location: 'HOME' | 'AWAY';
  venue: string;
  isRepeat: boolean;
  occurence?: number;
  isNotice?: boolean;
  oppositionTeam?: string;
  createdAt: string;
  createdBy: number;
  updatedAt: string;
  updatedBy: number;
}

export interface LocalTask {
  id: number;
  name: string;
  description?: string;
  dueDate?: string;
  priority: {
    id: number;
    name: string;
    weight: number;
  };
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  eventId?: number;
  event?: {
    id: number;
    name: string;
    venue: string;
  };
  playerTasks: Array<{
    player: {
      id: number;
      name: string;
    };
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface LocalPlayer {
  id: number;
  name: string;
  position: {
    id: number;
    name: string;
  };
  jersey: string;
  height: number;
}

export interface LocalPriority {
  id: number;
  name: string;
  weight: number;
}

export interface LocalPosition {
  id: number;
  name: string;
}

export interface LocalEventType {
  id: number;
  name: string;
  color: string;
  txtColor: string;
}

class LocalStorageService {
  private getStorageKey(type: string): string {
    return `lkmr_${type}`;
  }

  // Initialize default data if not exists
  initializeDefaultData(): void {
    if (!this.getEvents().length) {
      this.setEvents(this.getDefaultEvents());
    }
    if (!this.getTasks().length) {
      this.setTasks(this.getDefaultTasks());
    }
    if (!this.getPlayers().length) {
      this.setPlayers(this.getDefaultPlayers());
    }
    if (!this.getPriorities().length) {
      this.setPriorities(this.getDefaultPriorities());
    }
    if (!this.getPositions().length) {
      this.setPositions(this.getDefaultPositions());
    }
    if (!this.getEventTypes().length) {
      this.setEventTypes(this.getDefaultEventTypes());
    }
  }

  // Events
  getEvents(): LocalEvent[] {
    const data = localStorage.getItem(this.getStorageKey('events'));
    return data ? JSON.parse(data) : [];
  }

  setEvents(events: LocalEvent[]): void {
    localStorage.setItem(this.getStorageKey('events'), JSON.stringify(events));
  }

  addEvent(event: LocalEvent): LocalEvent {
    const events = this.getEvents();
    events.push(event);
    this.setEvents(events);
    return event;
  }

  getEvent(id: number): LocalEvent | undefined {
    return this.getEvents().find(event => event.id === id);
  }

  // Tasks
  getTasks(): LocalTask[] {
    const data = localStorage.getItem(this.getStorageKey('tasks'));
    return data ? JSON.parse(data) : [];
  }

  setTasks(tasks: LocalTask[]): void {
    localStorage.setItem(this.getStorageKey('tasks'), JSON.stringify(tasks));
  }

  getTask(id: number): LocalTask | undefined {
    return this.getTasks().find(task => task.id === id);
  }

  addTask(task: Omit<LocalTask, 'id' | 'createdAt' | 'updatedAt'>): LocalTask {
    const tasks = this.getTasks();
    const newId = tasks.length > 0 ? Math.max(...tasks.map(t => t.id)) + 1 : 1;
    const newTask: LocalTask = {
      ...task,
      id: newId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    tasks.push(newTask);
    this.setTasks(tasks);
    return newTask;
  }

  updateTask(id: number, updates: Partial<LocalTask>): LocalTask | null {
    const tasks = this.getTasks();
    const index = tasks.findIndex(task => task.id === id);
    if (index === -1) return null;
    
    tasks[index] = {
      ...tasks[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.setTasks(tasks);
    return tasks[index];
  }

  deleteTask(id: number): boolean {
    const tasks = this.getTasks();
    const filtered = tasks.filter(task => task.id !== id);
    if (filtered.length === tasks.length) return false;
    this.setTasks(filtered);
    return true;
  }

  // Players
  getPlayers(): LocalPlayer[] {
    const data = localStorage.getItem(this.getStorageKey('players'));
    return data ? JSON.parse(data) : [];
  }

  setPlayers(players: LocalPlayer[]): void {
    localStorage.setItem(this.getStorageKey('players'), JSON.stringify(players));
  }

  // Priorities
  getPriorities(): LocalPriority[] {
    const data = localStorage.getItem(this.getStorageKey('priorities'));
    return data ? JSON.parse(data) : [];
  }

  setPriorities(priorities: LocalPriority[]): void {
    localStorage.setItem(this.getStorageKey('priorities'), JSON.stringify(priorities));
  }

  // Positions
  getPositions(): LocalPosition[] {
    const data = localStorage.getItem(this.getStorageKey('positions'));
    return data ? JSON.parse(data) : [];
  }

  setPositions(positions: LocalPosition[]): void {
    localStorage.setItem(this.getStorageKey('positions'), JSON.stringify(positions));
  }

  // Event Types
  getEventTypes(): LocalEventType[] {
    const data = localStorage.getItem(this.getStorageKey('eventTypes'));
    return data ? JSON.parse(data) : [];
  }

  setEventTypes(eventTypes: LocalEventType[]): void {
    localStorage.setItem(this.getStorageKey('eventTypes'), JSON.stringify(eventTypes));
  }

  // Filter tasks by parameters
  getFilteredTasks(filters: {
    eventId?: number;
    status?: string;
    priorityId?: number;
    playerIds?: number[];
    name?: string;
    startDate?: string;
    endDate?: string;
    dueDate?: string;
  }): LocalTask[] {
    let tasks = this.getTasks();

    if (filters.eventId) {
      tasks = tasks.filter(task => task.eventId === filters.eventId);
    }

    if (filters.status) {
      tasks = tasks.filter(task => task.status === filters.status);
    }

    if (filters.priorityId) {
      tasks = tasks.filter(task => task.priority.id === filters.priorityId);
    }

    if (filters.playerIds && filters.playerIds.length > 0) {
      tasks = tasks.filter(task => 
        task.playerTasks.some(pt => filters.playerIds!.includes(pt.player.id))
      );
    }

    if (filters.name) {
      tasks = tasks.filter(task => 
        task.name.toLowerCase().includes(filters.name!.toLowerCase())
      );
    }

    if (filters.dueDate) {
      tasks = tasks.filter(task => task.dueDate === filters.dueDate);
    }

    if (filters.startDate && filters.endDate) {
      tasks = tasks.filter(task => {
        if (!task.dueDate) return false;
        return task.dueDate >= filters.startDate! && task.dueDate <= filters.endDate!;
      });
    }

    return tasks;
  }

  // Clear all data
  clearAllData(): void {
    const keys = ['events', 'tasks', 'players', 'priorities', 'positions', 'eventTypes'];
    keys.forEach(key => {
      localStorage.removeItem(this.getStorageKey(key));
    });
  }

  // Reset to default data
  resetToDefaults(): void {
    this.clearAllData();
    this.initializeDefaultData();
  }

  // Default data
  private getDefaultEventTypes(): LocalEventType[] {
    return [
      { id: 1, name: 'Practice', color: '#2196f3', txtColor: '#fff' },
      { id: 2, name: 'Game', color: '#4ecdc4', txtColor: '#fff' },
      { id: 3, name: 'Team Meeting', color: '#4caf50', txtColor: '#fff' },
      { id: 4, name: 'Scrimmage', color: '#ff9800', txtColor: '#fff' },
    ];
  }

  private getDefaultEvents(): LocalEvent[] {
    const eventTypes = this.getDefaultEventTypes();
    return [
      {
        id: 1,
        name: 'Eagles vs Hawks',
        startTime: '2025-03-15T19:00:00Z',
        endTime: '2025-03-15T21:00:00Z',
        eventTypeId: eventTypes[1].id, // Game
        eventType: eventTypes[1], // Game
        location: 'HOME',
        venue: 'Lincoln High School Gymnasium',
        isRepeat: false,
        occurence: 1,
        isNotice: false,
        oppositionTeam: 'Hawks',
        createdAt: '2025-01-21T10:00:00Z',
        createdBy: 1,
        updatedAt: '2025-01-21T10:00:00Z',
        updatedBy: 1
      },
      {
        id: 2,
        name: 'Team Practice',
        startTime: '2025-03-12T16:00:00Z',
        endTime: '2025-03-12T18:00:00Z',
        eventTypeId: eventTypes[0].id, // Practice
        eventType: eventTypes[0], // Practice
        location: 'HOME',
        venue: 'Lincoln High School Gymnasium',
        isRepeat: false,
        occurence: 1,
        isNotice: false,
        oppositionTeam: undefined,
        createdAt: '2025-01-21T10:00:00Z',
        createdBy: 1,
        updatedAt: '2025-01-21T10:00:00Z',
        updatedBy: 1
      },
      {
        id: 3,
        name: 'Strategy Meeting',
        startTime: '2025-03-10T15:00:00Z',
        endTime: '2025-03-10T16:00:00Z',
        eventTypeId: eventTypes[2].id, // Meeting
        eventType: eventTypes[2], // Meeting
        location: 'HOME',
        venue: 'Conference Room',
        isRepeat: false,
        occurence: 1,
        isNotice: false,
        oppositionTeam: undefined,
        createdAt: '2025-01-21T10:00:00Z',
        createdBy: 1,
        updatedAt: '2025-01-21T10:00:00Z',
        updatedBy: 1
      }
    ];
  }

  private getDefaultPlayers(): LocalPlayer[] {
    const positions = this.getDefaultPositions();
    return [
      { id: 1, name: 'Marcus Johnson', position: positions[0], jersey: '23', height: 198 }, // Point Guard
      { id: 2, name: 'Tyler Williams', position: positions[1], jersey: '10', height: 193 }, // Shooting Guard
      { id: 3, name: 'Jordan Davis', position: positions[2], jersey: '15', height: 203 }, // Small Forward
      { id: 4, name: 'Alex Thompson', position: positions[3], jersey: '4', height: 208 }, // Power Forward
      { id: 5, name: 'DeShawn Wilson', position: positions[4], jersey: '32', height: 213 }, // Center
      { id: 6, name: 'Carlos Rodriguez', position: positions[1], jersey: '7', height: 190 }, // Shooting Guard
      { id: 7, name: 'Jamal Mitchell', position: positions[2], jersey: '21', height: 201 }, // Small Forward
      { id: 8, name: 'Kevin Brown', position: positions[3], jersey: '12', height: 206 }, // Power Forward
    ];
  }

  private getDefaultPositions(): LocalPosition[] {
    return [
      { id: 1, name: 'Point Guard' },
      { id: 2, name: 'Shooting Guard' },
      { id: 3, name: 'Small Forward' },
      { id: 4, name: 'Power Forward' },
      { id: 5, name: 'Center' }
    ];
  }

  private getDefaultPriorities(): LocalPriority[] {
    return [
      { id: 1, name: 'High', weight: 1 },
      { id: 2, name: 'Medium', weight: 2 },
      { id: 3, name: 'Low', weight: 3 },
    ];
  }

  private getDefaultTasks(): LocalTask[] {
    const priorities = this.getDefaultPriorities();
    const players = this.getDefaultPlayers();
    
    return [
      // Game-specific tasks (Eagles vs Hawks - Event ID: 1)
      // High Priority Game Tasks (15 total)
      {
        id: 1,
        name: 'Review opponent scouting report',
        description: 'Analyze Hawks offensive and defensive strategies',
        dueDate: '2025-03-15',
        priority: priorities[0], // High
        status: 'DONE',
        eventId: 1,
        event: { id: 1, name: 'Eagles vs Hawks', venue: 'Lincoln High School Gymnasium' },
        playerTasks: [],
        createdAt: '2025-01-21T10:00:00Z',
        updatedAt: '2025-01-21T10:00:00Z'
      },
      {
        id: 2,
        name: 'Set up starting lineup',
        description: 'Confirm starting five and bench rotation',
        dueDate: '2025-03-15',
        priority: priorities[0], // High
        status: 'DONE',
        eventId: 1,
        event: { id: 1, name: 'Eagles vs Hawks', venue: 'Lincoln High School Gymnasium' },
        playerTasks: [{ player: players[0] }, { player: players[1] }, { player: players[2] }],
        createdAt: '2025-01-21T10:00:00Z',
        updatedAt: '2025-01-21T10:00:00Z'
      },
      {
        id: 3,
        name: 'Prepare game plan presentation',
        description: 'Create visual aids for pre-game team meeting',
        dueDate: '2025-03-15',
        priority: priorities[0], // High
        status: 'DONE',
        eventId: 1,
        event: { id: 1, name: 'Eagles vs Hawks', venue: 'Lincoln High School Gymnasium' },
        playerTasks: [],
        createdAt: '2025-01-21T10:00:00Z',
        updatedAt: '2025-01-21T10:00:00Z'
      },
      {
        id: 4,
        name: 'Check court conditions',
        description: 'Inspect playing surface and equipment',
        dueDate: '2025-03-15',
        priority: priorities[0], // High
        status: 'TODO',
        eventId: 1,
        event: { id: 1, name: 'Eagles vs Hawks', venue: 'Lincoln High School Gymnasium' },
        playerTasks: [{ player: players[3] }],
        createdAt: '2025-01-21T10:00:00Z',
        updatedAt: '2025-01-21T10:00:00Z'
      },
      {
        id: 5,
        name: 'Confirm referee assignments',
        description: 'Verify officiating crew and game logistics',
        dueDate: '2025-03-15',
        priority: priorities[0], // High
        status: 'TODO',
        eventId: 1,
        event: { id: 1, name: 'Eagles vs Hawks', venue: 'Lincoln High School Gymnasium' },
        playerTasks: [],
        createdAt: '2025-01-21T10:00:00Z',
        updatedAt: '2025-01-21T10:00:00Z'
      },
      {
        id: 6,
        name: 'Coordinate team warm-up',
        description: 'Plan 45-minute pre-game preparation routine',
        dueDate: '2025-03-15',
        priority: priorities[0], // High
        status: 'IN_PROGRESS',
        eventId: 1,
        event: { id: 1, name: 'Eagles vs Hawks', venue: 'Lincoln High School Gymnasium' },
        playerTasks: [{ player: players[0] }, { player: players[4] }],
        createdAt: '2025-01-21T10:00:00Z',
        updatedAt: '2025-01-21T10:00:00Z'
      },
      {
        id: 7,
        name: 'Review timeout strategies',
        description: 'Plan timeout usage and messaging',
        dueDate: '2025-03-15',
        priority: priorities[0], // High
        status: 'DONE',
        eventId: 1,
        event: { id: 1, name: 'Eagles vs Hawks', venue: 'Lincoln High School Gymnasium' },
        playerTasks: [],
        createdAt: '2025-01-21T10:00:00Z',
        updatedAt: '2025-01-21T10:00:00Z'
      },
      {
        id: 8,
        name: 'Set defensive matchups',
        description: 'Assign defensive responsibilities vs Hawks players',
        dueDate: '2025-03-15',
        priority: priorities[0], // High
        status: 'DONE',
        eventId: 1,
        event: { id: 1, name: 'Eagles vs Hawks', venue: 'Lincoln High School Gymnasium' },
        playerTasks: [{ player: players[1] }, { player: players[2] }],
        createdAt: '2025-01-21T10:00:00Z',
        updatedAt: '2025-01-21T10:00:00Z'
      },
      {
        id: 9,
        name: 'Check player injury status',
        description: 'Final medical clearance for all players',
        dueDate: '2025-03-15',
        priority: priorities[0], // High
        status: 'DONE',
        eventId: 1,
        event: { id: 1, name: 'Eagles vs Hawks', venue: 'Lincoln High School Gymnasium' },
        playerTasks: [{ player: players[0] }, { player: players[3] }, { player: players[4] }],
        createdAt: '2025-01-21T10:00:00Z',
        updatedAt: '2025-01-21T10:00:00Z'
      },
      {
        id: 10,
        name: 'Prepare substitution patterns',
        description: 'Plan rotation schedule and rest periods',
        dueDate: '2025-03-15',
        priority: priorities[0], // High
        status: 'DONE',
        eventId: 1,
        event: { id: 1, name: 'Eagles vs Hawks', venue: 'Lincoln High School Gymnasium' },
        playerTasks: [],
        createdAt: '2025-01-21T10:00:00Z',
        updatedAt: '2025-01-21T10:00:00Z'
      },
      {
        id: 11,
        name: 'Coordinate with athletic director',
        description: 'Confirm game day operations and logistics',
        dueDate: '2025-03-15',
        priority: priorities[0], // High
        status: 'DONE',
        eventId: 1,
        event: { id: 1, name: 'Eagles vs Hawks', venue: 'Lincoln High School Gymnasium' },
        playerTasks: [],
        createdAt: '2025-01-21T10:00:00Z',
        updatedAt: '2025-01-21T10:00:00Z'
      },
      {
        id: 12,
        name: 'Review special situations',
        description: 'Practice end-of-game and pressure situations',
        dueDate: '2025-03-15',
        priority: priorities[0], // High
        status: 'DONE',
        eventId: 1,
        event: { id: 1, name: 'Eagles vs Hawks', venue: 'Lincoln High School Gymnasium' },
        playerTasks: [{ player: players[0] }, { player: players[1] }],
        createdAt: '2025-01-21T10:00:00Z',
        updatedAt: '2025-01-21T10:00:00Z'
      },
      {
        id: 13,
        name: 'Check uniform readiness',
        description: 'Ensure all uniforms clean and game-ready',
        dueDate: '2025-03-15',
        priority: priorities[0], // High
        status: 'DONE',
        eventId: 1,
        event: { id: 1, name: 'Eagles vs Hawks', venue: 'Lincoln High School Gymnasium' },
        playerTasks: [{ player: players[5] }],
        createdAt: '2025-01-21T10:00:00Z',
        updatedAt: '2025-01-21T10:00:00Z'
      },
      {
        id: 14,
        name: 'Set halftime adjustments plan',
        description: 'Prepare potential tactical changes',
        dueDate: '2025-03-15',
        priority: priorities[0], // High
        status: 'DONE',
        eventId: 1,
        event: { id: 1, name: 'Eagles vs Hawks', venue: 'Lincoln High School Gymnasium' },
        playerTasks: [],
        createdAt: '2025-01-21T10:00:00Z',
        updatedAt: '2025-01-21T10:00:00Z'
      },
      {
        id: 15,
        name: 'Final team meeting agenda',
        description: 'Prepare motivational speech and key points',
        dueDate: '2025-03-15',
        priority: priorities[0], // High
        status: 'DONE',
        eventId: 1,
        event: { id: 1, name: 'Eagles vs Hawks', venue: 'Lincoln High School Gymnasium' },
        playerTasks: [],
        createdAt: '2025-01-21T10:00:00Z',
        updatedAt: '2025-01-21T10:00:00Z'
      },

      // Medium Priority Tasks (8 total)
      {
        id: 16,
        name: 'Update player statistics',
        description: 'Record latest game performance data',
        dueDate: '2025-03-20',
        priority: priorities[1], // Medium
        status: 'TODO',
        eventId: undefined,
        event: undefined,
        playerTasks: [],
        createdAt: '2025-01-21T10:00:00Z',
        updatedAt: '2025-01-21T10:00:00Z'
      },
      {
        id: 17,
        name: 'Schedule equipment maintenance',
        description: 'Basketball hoops and scoreboard check',
        dueDate: '2025-03-18',
        priority: priorities[1], // Medium
        status: 'TODO',
        eventId: undefined,
        event: undefined,
        playerTasks: [],
        createdAt: '2025-01-21T10:00:00Z',
        updatedAt: '2025-01-21T10:00:00Z'
      },
      {
        id: 18,
        name: 'Plan next practice session',
        description: 'Design drills for upcoming training',
        dueDate: '2025-03-17',
        priority: priorities[1], // Medium
        status: 'IN_PROGRESS',
        eventId: 2,
        event: { id: 2, name: 'Team Practice', venue: 'Lincoln High School Gymnasium' },
        playerTasks: [],
        createdAt: '2025-01-21T10:00:00Z',
        updatedAt: '2025-01-21T10:00:00Z'
      },
      {
        id: 19,
        name: 'Review team fitness levels',
        description: 'Assess conditioning and injury prevention',
        dueDate: '2025-03-22',
        priority: priorities[1], // Medium
        status: 'TODO',
        eventId: undefined,
        event: undefined,
        playerTasks: [{ player: players[0] }, { player: players[4] }],
        createdAt: '2025-01-21T10:00:00Z',
        updatedAt: '2025-01-21T10:00:00Z'
      },
      {
        id: 20,
        name: 'Update parent communication',
        description: 'Send weekly team newsletter',
        dueDate: '2025-03-19',
        priority: priorities[1], // Medium
        status: 'TODO',
        eventId: undefined,
        event: undefined,
        playerTasks: [],
        createdAt: '2025-01-21T10:00:00Z',
        updatedAt: '2025-01-21T10:00:00Z'
      },
      {
        id: 21,
        name: 'Order team snacks',
        description: 'Purchase post-game refreshments',
        dueDate: '2025-03-16',
        priority: priorities[1], // Medium
        status: 'TODO',
        eventId: undefined,
        event: undefined,
        playerTasks: [],
        createdAt: '2025-01-21T10:00:00Z',
        updatedAt: '2025-01-21T10:00:00Z'
      },
      {
        id: 22,
        name: 'Schedule team photos',
        description: 'Coordinate with school photographer',
        dueDate: '2025-03-25',
        priority: priorities[1], // Medium
        status: 'TODO',
        eventId: undefined,
        event: undefined,
        playerTasks: [],
        createdAt: '2025-01-21T10:00:00Z',
        updatedAt: '2025-01-21T10:00:00Z'
      },
      {
        id: 23,
        name: 'Review scholarship opportunities',
        description: 'Research college recruitment options for seniors',
        dueDate: '2025-03-30',
        priority: priorities[1], // Medium
        status: 'IN_PROGRESS',
        eventId: undefined,
        event: undefined,
        playerTasks: [{ player: players[0] }, { player: players[2] }],
        createdAt: '2025-01-21T10:00:00Z',
        updatedAt: '2025-01-21T10:00:00Z'
      },

      // Low Priority Tasks (3 total)
      {
        id: 24,
        name: 'Organize team social event',
        description: 'Plan end-of-season team bonding activity',
        dueDate: '2025-04-01',
        priority: priorities[2], // Low
        status: 'TODO',
        eventId: undefined,
        event: undefined,
        playerTasks: [],
        createdAt: '2025-01-21T10:00:00Z',
        updatedAt: '2025-01-21T10:00:00Z'
      },
      {
        id: 25,
        name: 'Update team website',
        description: 'Add recent game highlights and stats',
        dueDate: '2025-03-28',
        priority: priorities[2], // Low
        status: 'TODO',
        eventId: undefined,
        event: undefined,
        playerTasks: [],
        createdAt: '2025-01-21T10:00:00Z',
        updatedAt: '2025-01-21T10:00:00Z'
      },
      {
        id: 26,
        name: 'Clean coaching office',
        description: 'Organize files and clear workspace',
        dueDate: '2025-03-31',
        priority: priorities[2], // Low
        status: 'TODO',
        eventId: undefined,
        event: undefined,
        playerTasks: [],
        createdAt: '2025-01-21T10:00:00Z',
        updatedAt: '2025-01-21T10:00:00Z'
      }
    ];
  }
}

export const localStorageService = new LocalStorageService(); 
 