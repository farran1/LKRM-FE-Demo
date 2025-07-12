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
        { id: 2, name: 'Game', color: '#f44336', txtColor: '#fff' },
        { id: 3, name: 'Meeting', color: '#4caf50', txtColor: '#fff' },
      ],
    })
  }),
  // Mock events
  http.get('/api/events', () => {
    return HttpResponse.json({
      data: [
        { id: 1, name: 'Practice 1', startTime: '2024-07-10T10:00:00Z', endTime: '2024-07-10T12:00:00Z', eventType: { id: 1, name: 'Practice', color: '#2196f3', txtColor: '#fff' }, location: 'HOME', venue: 'Main Field' },
        { id: 2, name: 'Game 1', startTime: '2024-07-12T15:00:00Z', endTime: '2024-07-12T17:00:00Z', eventType: { id: 2, name: 'Game', color: '#f44336', txtColor: '#fff' }, location: 'AWAY', venue: 'Stadium' },
      ],
      meta: { total: 2, page: 1, perPage: 20 },
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
        { id: 1, name: 'Player One', position: { id: 1, name: 'Forward' }, jersey: '10', weight: 75, height: 180 },
        { id: 2, name: 'Player Two', position: { id: 2, name: 'Goalkeeper' }, jersey: '1', weight: 80, height: 185 },
      ],
      meta: { total: 2, page: 1, perPage: 20 },
    })
  }),
  // Mock tasks
  http.get('/api/tasks', () => {
    return HttpResponse.json({
      data: [
        { id: 1, name: 'Task 1', dueDate: '2024-07-15', priority: { id: 1, weight: 1 }, status: 'TODO' },
        { id: 2, name: 'Task 2', dueDate: '2024-07-20', priority: { id: 2, weight: 2 }, status: 'IN_PROGRESS' },
      ],
      meta: { total: 2, page: 1, perPage: 20 },
    })
  }),
  // Mock login
  http.post('/api/login', () => {
    return HttpResponse.json({ token: 'dev-token' })
  }),
  // Add more handlers as needed for your app
] 