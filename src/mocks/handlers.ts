// DEV-ONLY: MSW handlers for API mocking. Expand as needed for more endpoints.
import { http, HttpResponse } from 'msw'

export const handlers = [
  // Mock profile/me endpoint
  http.get('/api/me', () => {
    return HttpResponse.json({
      id: 1,
      firstName: 'Dev',
      lastName: 'User',
      email: 'dev@example.com',
      role: 'COACH',
    })
  }),
  // Mock event types
  http.get('/api/eventTypes', () => {
    return HttpResponse.json({
      data: [
        { id: 1, name: 'Practice', color: '#2196f3', txtColor: '#fff' },
        { id: 2, name: 'Game', color: '#4ecdc4', txtColor: '#fff' },
        { id: 3, name: 'Meeting', color: '#4caf50', txtColor: '#fff' },
      ],
    })
  }),
  // Mock events
  http.get('/api/events', () => {
    return HttpResponse.json({
      data: [
        { 
          id: 1, 
          name: 'Eagles vs Hawks', 
          startTime: '2025-03-15T19:00:00Z', 
          endTime: '2025-03-15T21:00:00Z', 
          eventType: { id: 2, name: 'Game', color: '#4ecdc4', txtColor: '#fff' }, 
          location: 'HOME', 
          venue: 'Home Court',
          isRepeat: false
        },
        { 
          id: 2, 
          name: 'Practice Session', 
          startTime: '2025-03-12T16:00:00Z', 
          endTime: '2025-03-12T18:00:00Z', 
          eventType: { id: 1, name: 'Practice', color: '#2196f3', txtColor: '#fff' }, 
          location: 'HOME', 
          venue: 'Training Ground',
          isRepeat: false
        },
      ],
      meta: { total: 2, page: 1, perPage: 20 },
    })
  }),
  // Mock event players
  http.get('/api/events/:id/players', () => {
    return HttpResponse.json({
      data: [
        { id: 1, name: 'Player One', position: { id: 1, name: 'Forward' } },
        { id: 2, name: 'Player Two', position: { id: 2, name: 'Goalkeeper' } },
        { id: 3, name: 'Player Three', position: { id: 3, name: 'Defender' } },
      ]
    })
  }),
  // Mock profile
  http.get('/api/profile', () => {
    return HttpResponse.json({
      id: 1,
      firstName: 'Dev',
      lastName: 'User',
      email: 'dev@example.com',
      role: 'COACH',
    })
  }),
  // Mock players
  http.get('/api/players', () => {
    return HttpResponse.json({
      data: [
        { id: 1, name: 'Player One', position: { id: 1, name: 'Forward' }, jersey: '10', height: 180 },
        { id: 2, name: 'Player Two', position: { id: 2, name: 'Goalkeeper' }, jersey: '1', height: 185 },
        { id: 3, name: 'Player Three', position: { id: 3, name: 'Defender' }, jersey: '5', height: 178 },
      ],
      meta: { total: 3, page: 1, perPage: 20 },
    })
  }),
  // Mock positions
  http.get('/api/positions', () => {
    return HttpResponse.json({
      data: [
        { id: 1, name: 'Forward' },
        { id: 2, name: 'Goalkeeper' },
        { id: 3, name: 'Defender' },
        { id: 4, name: 'Midfielder' }
      ]
    })
  }),
  // Mock tasks with eventId support
  http.get('/api/tasks', ({ request }) => {
    const url = new URL(request.url)
    const eventId = url.searchParams.get('eventId')
    const status = url.searchParams.get('status')
    const priorityId = url.searchParams.get('priorityId')
    
    // Mock tasks for game event (eventId = 1)
    const gameTasks = [
      { 
        id: 1, 
        name: 'Set up equipment', 
        description: 'Prepare court and equipment for the game',
        dueDate: '2025-03-15', 
        priority: { id: 1, name: 'High', weight: 1 }, 
        status: 'TODO',
        eventId: 1,
        event: { id: 1, name: 'Eagles vs Hawks', venue: 'Home Court' },
        playerTasks: [
          { player: { id: 1, name: 'Player One' } }
        ]
      },
      { 
        id: 2, 
        name: 'Team warm-up', 
        description: 'Complete pre-game warm-up routine',
        dueDate: '2025-03-15', 
        priority: { id: 2, name: 'Medium', weight: 2 }, 
        status: 'IN_PROGRESS',
        eventId: 1,
        event: { id: 1, name: 'Eagles vs Hawks', venue: 'Home Court' },
        playerTasks: [
          { player: { id: 1, name: 'Player One' } },
          { player: { id: 2, name: 'Player Two' } }
        ]
      },
      { 
        id: 3, 
        name: 'Review game plan', 
        description: 'Final review of strategies and plays',
        dueDate: '2025-03-15', 
        priority: { id: 1, name: 'High', weight: 1 }, 
        status: 'DONE',
        eventId: 1,
        event: { id: 1, name: 'Eagles vs Hawks', venue: 'Home Court' },
        playerTasks: []
      },
      { 
        id: 4, 
        name: 'Check uniforms', 
        description: 'Ensure all players have proper uniforms',
        dueDate: '2025-03-15', 
        priority: { id: 2, name: 'Medium', weight: 2 }, 
        status: 'TODO',
        eventId: 1,
        event: { id: 1, name: 'Eagles vs Hawks', venue: 'Home Court' },
        playerTasks: [
          { player: { id: 3, name: 'Player Three' } }
        ]
      }
    ]
    
    // General tasks not tied to events
    const generalTasks = [
      { 
        id: 5, 
        name: 'Update player stats', 
        description: 'Update season statistics',
        dueDate: '2025-03-20', 
        priority: { id: 3, name: 'Low', weight: 3 }, 
        status: 'TODO',
        eventId: null,
        event: null,
        playerTasks: []
      }
    ]
    
    let tasks = [...gameTasks, ...generalTasks]
    
    // Filter by eventId if provided
    if (eventId) {
      tasks = tasks.filter(task => task.eventId === parseInt(eventId))
    }
    
    // Filter by status if provided
    if (status) {
      tasks = tasks.filter(task => task.status === status)
    }
    
    // Filter by priorityId if provided
    if (priorityId) {
      tasks = tasks.filter(task => task.priority.id === parseInt(priorityId))
    }
    
    return HttpResponse.json({
      data: tasks,
      meta: { total: tasks.length, page: 1, perPage: 20 },
    })
  }),
  // Mock priorities
  http.get('/api/priorities', () => {
    return HttpResponse.json({
      data: [
        { id: 1, name: 'High', weight: 1 },
        { id: 2, name: 'Medium', weight: 2 },
        { id: 3, name: 'Low', weight: 3 },
      ]
    })
  }),
  // Mock login
  http.post('/api/login', () => {
    return HttpResponse.json({ token: 'dev-token' })
  }),
  // Add more handlers as needed for your app
];