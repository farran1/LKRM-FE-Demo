// Local API service that simulates backend behavior using localStorage
import { localStorageService } from './local-storage';

export interface ApiResponse<T> {
  data?: T;
  meta?: {
    total: number;
    page: number;
    perPage: number;
    lastPage?: number;
  };
  error?: string;
}

class LocalApiService {
  private delay(ms: number = 100): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Events
  async getEvents(params?: {
    page?: number;
    perPage?: number;
    startDate?: string;
    endDate?: string;
    name?: string;
  }): Promise<ApiResponse<any[]>> {
    await this.delay();
    const events = localStorageService.getEvents();
    const page = params?.page || 1;
    const perPage = params?.perPage || 20;
    const start = (page - 1) * perPage;
    const end = start + perPage;
    
    return {
      data: events.slice(start, end),
      meta: {
        total: events.length,
        page,
        perPage,
        lastPage: Math.ceil(events.length / perPage)
      }
    };
  }

  async getEvent(id: number): Promise<ApiResponse<any>> {
    await this.delay();
    const event = localStorageService.getEvent(id);
    if (!event) {
      return { error: 'Event not found' };
    }
    return { data: event };
  }

  async getEventPlayers(eventId: number): Promise<ApiResponse<any[]>> {
    await this.delay();
    // For demo purposes, return all players
    const players = localStorageService.getPlayers();
    return { data: players };
  }

  async createEvent(eventData: any): Promise<ApiResponse<any>> {
    await this.delay();
    
    // Validate required fields
    if (!eventData.name || !eventData.eventTypeId || !eventData.startTime || !eventData.location || !eventData.venue) {
      return { error: 'Missing required fields' };
    }

    // Get event types to validate eventTypeId
    const eventTypes = localStorageService.getEventTypes();
    const eventType = eventTypes.find(et => et.id === eventData.eventTypeId);
    if (!eventType) {
      return { error: 'Event Type not found' };
    }

    // Create new event
    const newEvent = {
      id: Date.now(), // Simple ID generation
      name: eventData.name,
      eventTypeId: eventData.eventTypeId,
      eventType: eventType,
      startTime: eventData.startTime,
      endTime: eventData.endTime || null,
      isRepeat: eventData.isRepeat || false,
      occurence: eventData.occurence || 0,
      location: eventData.location,
      venue: eventData.venue,
      isNotice: eventData.isNotice || false,
      oppositionTeam: eventData.oppositionTeam || null,
      createdAt: new Date().toISOString(),
      createdBy: 1, // Default user ID for local development
      updatedAt: new Date().toISOString(),
      updatedBy: 1
    };

    // Add to localStorage
    localStorageService.addEvent(newEvent);

    return { data: newEvent };
  }

  async updateEvent(id: number, eventData: any): Promise<ApiResponse<any>> {
    await this.delay();
    
    // Get existing event
    const events = localStorageService.getEvents();
    const eventIndex = events.findIndex(e => e.id === id);
    
    if (eventIndex === -1) {
      return { error: 'Event not found' };
    }

    // Validate event type if provided
    if (eventData.eventTypeId) {
      const eventTypes = localStorageService.getEventTypes();
      const eventType = eventTypes.find(et => et.id === eventData.eventTypeId);
      if (!eventType) {
        return { error: 'Event Type not found' };
      }
      eventData.eventType = eventType;
    }

    // Update event
    const updatedEvent = {
      ...events[eventIndex],
      ...eventData,
      id, // Ensure ID doesn't change
      updatedAt: new Date().toISOString(),
      updatedBy: 1
    };

    events[eventIndex] = updatedEvent;
    localStorageService.setEvents(events);

    return { data: updatedEvent };
  }

  // Tasks
  async getTasks(params?: {
    page?: number;
    perPage?: number;
    eventId?: number;
    status?: string;
    priorityId?: number;
    playerIds?: number[];
    name?: string;
    startDate?: string;
    endDate?: string;
    dueDate?: string;
    viewMode?: string;
    sortBy?: string;
    sortDirection?: string;
  }): Promise<ApiResponse<any[]>> {
    await this.delay();
    
    const filters = {
      eventId: params?.eventId,
      status: params?.status,
      priorityId: params?.priorityId,
      playerIds: params?.playerIds,
      name: params?.name,
      startDate: params?.startDate,
      endDate: params?.endDate,
      dueDate: params?.dueDate
    };

    let tasks = localStorageService.getFilteredTasks(filters);

    // Apply sorting
    if (params?.sortBy) {
      tasks.sort((a, b) => {
        let aVal, bVal;
        switch (params.sortBy) {
          case 'name':
            aVal = a.name.toLowerCase();
            bVal = b.name.toLowerCase();
            break;
          case 'dueDate':
            aVal = a.dueDate || '';
            bVal = b.dueDate || '';
            break;
          case 'priority':
            aVal = a.priority.weight;
            bVal = b.priority.weight;
            break;
          case 'status':
            aVal = a.status;
            bVal = b.status;
            break;
          default:
            aVal = a.id;
            bVal = b.id;
        }
        
        if (params.sortDirection === 'asc') {
          return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        } else {
          return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
        }
      });
    }

    // Handle different view modes
    if (params?.viewMode === 'progress') {
      const todoTasks = tasks.filter(t => t.status === 'TODO');
      const inProgressTasks = tasks.filter(t => t.status === 'IN_PROGRESS');
      const doneTasks = tasks.filter(t => t.status === 'DONE');
      
      return {
        data: {
          todoTasks,
          inProgressTasks,
          doneTasks
        } as any
      };
    }

    if (params?.viewMode === 'calendar') {
      return { data: { tasks } as any };
    }

    // Regular list view with pagination
    const page = params?.page || 1;
    const perPage = params?.perPage || 20;
    const start = (page - 1) * perPage;
    const end = start + perPage;
    
    return {
      data: tasks.slice(start, end),
      meta: {
        total: tasks.length,
        page,
        perPage,
        lastPage: Math.ceil(tasks.length / perPage)
      }
    };
  }

  async createTask(taskData: any): Promise<ApiResponse<any>> {
    await this.delay();
    try {
      const newTask = localStorageService.addTask(taskData);
      return { data: { task: newTask } };
    } catch (error) {
      return { error: 'Failed to create task' };
    }
  }

  async updateTask(id: number, taskData: any): Promise<ApiResponse<any>> {
    await this.delay();
    try {
      const updatedTask = localStorageService.updateTask(id, taskData);
      if (!updatedTask) {
        return { error: 'Task not found' };
      }
      return { data: { task: updatedTask } };
    } catch (error) {
      return { error: 'Failed to update task' };
    }
  }

  async deleteTask(id: number): Promise<ApiResponse<any>> {
    await this.delay();
    const success = localStorageService.deleteTask(id);
    if (!success) {
      return { error: 'Task not found' };
    }
    return { data: { success: true } };
  }

  // Players
  async getPlayers(params?: {
    page?: number;
    perPage?: number;
    name?: string;
    positionIds?: number[];
  }): Promise<ApiResponse<any[]>> {
    await this.delay();
    let players = localStorageService.getPlayers();
    
    if (params?.name) {
      players = players.filter(p => 
        p.name.toLowerCase().includes(params.name!.toLowerCase())
      );
    }
    
    if (params?.positionIds && params.positionIds.length > 0) {
      players = players.filter(p => 
        params.positionIds!.includes(p.position.id)
      );
    }

    const page = params?.page || 1;
    const perPage = params?.perPage || 20;
    const start = (page - 1) * perPage;
    const end = start + perPage;
    
    return {
      data: players.slice(start, end),
      meta: {
        total: players.length,
        page,
        perPage,
        lastPage: Math.ceil(players.length / perPage)
      }
    };
  }

  async getPlayer(id: number): Promise<ApiResponse<any>> {
    await this.delay();
    const players = localStorageService.getPlayers();
    const player = players.find(p => p.id === id);
    
    if (!player) {
      return { error: 'Player not found' };
    }

    // Add mock statistics and additional data
    const playerWithStats = {
      ...player,
      stats: {
        gamesPlayed: 15,
        pointsPerGame: 18.2,
        assistsPerGame: 5.8,
        reboundsPerGame: 4.3,
        fieldGoalPercentage: 0.456,
        threePointPercentage: 0.382,
        freeThrowPercentage: 0.823
      },
      recentGames: [
        { date: '2024-01-15', opponent: 'Lakers', points: 22, assists: 7, rebounds: 5 },
        { date: '2024-01-12', opponent: 'Warriors', points: 18, assists: 4, rebounds: 3 },
        { date: '2024-01-10', opponent: 'Celtics', points: 25, assists: 8, rebounds: 6 }
      ]
    };
    
    return { data: { player: playerWithStats } };
  }

  async getPlayerNotes(playerId: number): Promise<ApiResponse<any[]>> {
    await this.delay();
    
    // Mock notes data for demo
    const mockNotes = [
      {
        id: 1,
        playerId,
        note: 'Excellent performance in last practice. Shows great leadership skills.',
        createdAt: '2024-01-15T10:30:00Z',
        createdUser: {
          profile: {
            firstName: 'Coach',
            lastName: 'Smith'
          }
        }
      },
      {
        id: 2,
        playerId,
        note: 'Needs to work on defensive positioning. Schedule extra practice.',
        createdAt: '2024-01-12T14:15:00Z',
        createdUser: {
          profile: {
            firstName: 'Assistant',
            lastName: 'Coach'
          }
        }
      },
      {
        id: 3,
        playerId,
        note: 'Great improvement in three-point shooting. Keep up the practice routine.',
        createdAt: '2024-01-10T09:45:00Z',
        createdUser: {
          profile: {
            firstName: 'Coach',
            lastName: 'Smith'
          }
        }
      }
    ];
    
    return { data: { notes: mockNotes } };
  }

  async getPlayerGoals(playerId: number): Promise<ApiResponse<any[]>> {
    await this.delay();
    
    // Mock goals data for demo
    const mockGoals = [
      {
        id: 1,
        playerId,
        note: 'Improve three-point shooting percentage to 40% by end of season',
        createdAt: '2024-01-01T00:00:00Z',
        createdUser: {
          profile: {
            firstName: 'Coach',
            lastName: 'Smith'
          }
        }
      },
      {
        id: 2,
        playerId,
        note: 'Reduce turnovers to less than 2 per game',
        createdAt: '2024-01-01T00:00:00Z',
        createdUser: {
          profile: {
            firstName: 'Player',
            lastName: 'Self'
          }
        }
      },
      {
        id: 3,
        playerId,
        note: 'Develop better court vision and increase assists to 6+ per game',
        createdAt: '2024-01-05T00:00:00Z',
        createdUser: {
          profile: {
            firstName: 'Coach',
            lastName: 'Smith'
          }
        }
      }
    ];
    
    return { data: { goals: mockGoals } };
  }

  // Priorities
  async getPriorities(): Promise<ApiResponse<any[]>> {
    await this.delay();
    const priorities = localStorageService.getPriorities();
    return { data: priorities };
  }

  // Positions
  async getPositions(): Promise<ApiResponse<any[]>> {
    await this.delay();
    const positions = localStorageService.getPositions();
    return { data: positions };
  }

  // Event Types
  async getEventTypes(): Promise<ApiResponse<any[]>> {
    await this.delay();
    const eventTypes = localStorageService.getEventTypes();
    return { data: eventTypes };
  }

  // Profile/Auth
  async getProfile(): Promise<ApiResponse<any>> {
    await this.delay();
    return {
      data: {
        id: 1,
        firstName: 'Demo',
        lastName: 'User',
        email: 'demo@lkmr.com',
        role: 'COACH'
      }
    };
  }

  async login(credentials: any): Promise<ApiResponse<any>> {
    await this.delay();
    return { data: { token: 'demo-token' } };
  }

  // Utility methods
  async resetData(): Promise<ApiResponse<any>> {
    await this.delay();
    localStorageService.resetToDefaults();
    return { data: { success: true } };
  }

  async clearData(): Promise<ApiResponse<any>> {
    await this.delay();
    localStorageService.clearAllData();
    return { data: { success: true } };
  }
}

export const localApiService = new LocalApiService(); 
 