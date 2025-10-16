import { SupabaseAPI } from './supabase-api'
import { supabase } from '@/lib/supabase'
// Note: For server-side mutations (events), proxy to Next API routes

// Create API instance
const supa = new SupabaseAPI()

// Minimal axios-shaped response helper
const ok = (data: unknown, status = 200) => ({ data, status })
const fail = (error: unknown, status = 500) => ({ data: { success: false, error }, status })

// SWR fetcher function
export const fetcher = async (url: string) => {
  try {
    if (url.startsWith('/api/')) {
      // Get the current session to include auth headers
      const { data: { session } } = await supabase.auth.getSession()
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }
      
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`
      }
      
      // Call the actual API routes with auth headers
      const response = await fetch(url, {
        method: 'GET',
        headers
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.error || 'Unknown error'}`)
      }
      return await response.json()
    }
    throw new Error(`Unsupported URL: ${url}`)
  } catch (error) {
    throw error
  }
}

// Path router mapping '/api/*' calls to SupabaseAPI methods
async function routePatch(path: string, data?: any) {
	try {
		// Get the current session to include auth headers
		const { data: { session } } = await supabase.auth.getSession()
		const headers: HeadersInit = {
			'Content-Type': 'application/json',
		}
		
		if (session?.access_token) {
			headers['Authorization'] = `Bearer ${session.access_token}`
		}
		
		// Call the actual API routes with auth headers
		const response = await fetch(path, {
			method: 'PATCH',
			headers,
			body: data ? JSON.stringify(data) : undefined
		})
		
		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}))
			throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.error || 'Unknown error'}`)
		}
		
		const responseData = await response.json()
		return ok(responseData, response.status)
	} catch (error) {
		console.error('Route PATCH error:', error)
		throw error
	}
}

async function routeGet(path: string, params?: Record<string, any>) {
	try {
		if (path === '/api/eventTypes') {
			const rows = await supa.getEventTypes()
			return ok({ data: rows })
		}
		if (path === '/api/events') {
			const rows = await supa.getEvents(params)
			// Normalize to array for UI helpers expecting data arrays
			return ok({ data: rows.data })
		}
		const eventIdMatch = path.match(/^\/api\/events\/(\d+)$/)
		if (eventIdMatch) {
			const id = Number(eventIdMatch[1])
			const row = await supa.getEvent(id)
			return ok({ data: row })
		}
		// Player routes
		if (path === '/api/players') {
			const rows = await supa.getPlayers(params)
			return ok({ data: rows })
		}
		if (path === '/api/positions') {
			const rows = await supa.getPositions()
			return ok({ data: rows })
		}
		if (path === '/api/priorities') {
			const rows = await supa.getPriorities()
			return ok({ data: rows })
		}
		if (path === '/api/schema-check') {
			const schema = await supa.checkDatabaseSchema()
			return ok({ data: schema })
		}
		const playerIdMatch = path.match(/^\/api\/players\/(\d+)$/)
		if (playerIdMatch) {
			const id = Number(playerIdMatch[1])
			const row = await supa.getPlayer(id)
			return ok({ data: row })
		}
        // Player notes/goals routes -> proxy to Next API (ensures server-side service client & RLS bypass)
        const playerNotesMatch = path.match(/^\/api\/players\/(\d+)\/notes$/)
        if (playerNotesMatch) {
            const { data: { session } } = await supabase.auth.getSession()
            const headers: HeadersInit = { 'Content-Type': 'application/json' }
            if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`
            const resp = await fetch(path, { method: 'GET', headers })
            const json = await resp.json().catch(() => undefined)
            return ok(json, resp.status)
        }
        const playerGoalsMatch = path.match(/^\/api\/(players\/(\d+)\/goals)$/)
        if (playerGoalsMatch) {
            const { data: { session } } = await supabase.auth.getSession()
            const headers: HeadersInit = { 'Content-Type': 'application/json' }
            if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`
            const resp = await fetch(path, { method: 'GET', headers })
            const json = await resp.json().catch(() => undefined)
            return ok(json, resp.status)
        }
		// Player notes routes
		if (path === '/api/player-notes') {
			const playerId = params?.playerId
			if (!playerId) throw new Error('playerId parameter required')
			const rows = await supa.getPlayerNotes(Number(playerId))
			return ok({ data: rows })
		}
		// Player goals routes
		if (path === '/api/player-goals') {
			const playerId = params?.playerId
			if (!playerId) throw new Error('playerId parameter required')
			const rows = await supa.getPlayerGoals(Number(playerId))
			return ok({ data: rows })
		}
		// Budgets
		if (path === '/api/budgets') {
			const rows = await supa.getBudgets(params)
			return ok({ data: rows })
		}
		if (path === '/api/budgets/:id') {
			const id = Number(path.match(/^\/api\/budgets\/(\d+)$/)?.[1])
			if (!id) throw new Error('id parameter required')
			const row = await supa.getBudget(id)
			return ok({ data: row })
		}
		// Expenses
		if (path === '/api/expenses') {
			const rows = await supa.getExpenses(params)
			return ok({ data: rows })
		}
		if (path === '/api/expenses/:id') {
			const id = Number(path.match(/^\/api\/expenses\/(\d+)$/)?.[1])
			if (!id) throw new Error('id parameter required')
			const row = await supa.getExpense(id)
			return ok({ data: row })
		}
		// Budget Categories
		if (path === '/api/budget-categories') {
			const rows = await supa.getBudgetCategories()
			return ok({ data: rows })
		}
		// Tasks
		if (path === '/api/tasks') {
			const rows = await supa.getTasks(params)
			// Normalize to array for UI helpers
			return ok({ data: rows.data })
		}
		// Priorities
		if (path === '/api/priorities') {
			const rows = await supa.getPriorities()
			return ok({ data: rows })
		}
		// Generic handler for all other API routes
		if (path.startsWith('/api/')) {
			// Get the current session to include auth headers
			const { data: { session } } = await supabase.auth.getSession()
			const headers: HeadersInit = {
				'Content-Type': 'application/json',
			}
			
			if (session?.access_token) {
				headers['Authorization'] = `Bearer ${session.access_token}`
			}
			
			const resp = await fetch(path, {
				method: 'GET',
				headers,
			})
			const json = await resp.json().catch(() => undefined)
			return ok(json, resp.status)
		}
		
		// Fallback: not implemented
		throw new Error(`GET ${path} not implemented`)
	} catch (error) {
		return fail(error)
	}
}

async function routePost(path: string, body?: any) {
	try {
		if (path === '/api/eventTypes') {
			const row = await supa.createEventType(body)
			return ok({ data: row }, 201)
		}
		if (path === '/api/events') {
			// Get the current session to include auth headers
			const { data: { session } } = await supabase.auth.getSession()
			const headers: HeadersInit = {
				'Content-Type': 'application/json',
			}
			
			if (session?.access_token) {
				headers['Authorization'] = `Bearer ${session.access_token}`
			}
			
			const resp = await fetch('/api/events', {
				method: 'POST',
				headers,
				body: JSON.stringify(body),
			})
			const json = await resp.json().catch(() => undefined)
			return ok(json, resp.status)
		}
		if (path === '/api/live-game-events') {
			// Get the current session to include auth headers
			const { data: { session } } = await supabase.auth.getSession()
			const headers: HeadersInit = {
				'Content-Type': 'application/json',
			}
			
			if (session?.access_token) {
				headers['Authorization'] = `Bearer ${session.access_token}`
			}
			
			const resp = await fetch('/api/live-game-events', {
				method: 'POST',
				headers,
				body: JSON.stringify(body),
			})
			const json = await resp.json().catch(() => undefined)
			return ok(json, resp.status)
		}
		// Player routes
		if (path === '/api/players') {
			const row = await supa.createPlayer(body)
			return ok({ data: row }, 201)
		}
        // Player notes/goals routes -> proxy to Next API (ensures server-side service client & RLS bypass)
        const playerNotesPostMatch = path.match(/^\/api\/players\/(\d+)\/notes$/)
        if (playerNotesPostMatch) {
            const { data: { session } } = await supabase.auth.getSession()
            const headers: HeadersInit = { 'Content-Type': 'application/json' }
            if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`
            const resp = await fetch(path, { method: 'POST', headers, body: JSON.stringify(body) })
            const json = await resp.json().catch(() => undefined)
            return ok(json, resp.status)
        }
        const playerGoalsPostMatch = path.match(/^\/api\/players\/(\d+)\/goals$/)
        if (playerGoalsPostMatch) {
            const { data: { session } } = await supabase.auth.getSession()
            const headers: HeadersInit = { 'Content-Type': 'application/json' }
            if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`
            const resp = await fetch(path, { method: 'POST', headers, body: JSON.stringify(body) })
            const json = await resp.json().catch(() => undefined)
            return ok(json, resp.status)
        }
		// Player notes routes
		if (path === '/api/player-notes') {
			const row = await supa.createPlayerNote(body)
			return ok({ data: row }, 201)
		}
		// Player goals routes
		if (path === '/api/player-goals') {
			const row = await supa.createPlayerGoal(body)
			return ok({ data: row }, 201)
		}
		// Budgets
		if (path === '/api/budgets') {
			const row = await supa.createBudget(body)
			return ok({ data: row }, 201)
		}
		// Expenses
		if (path === '/api/expenses') {
			const row = await supa.createExpense(body)
			return ok({ data: row }, 201)
		}
		// Tasks
		if (path === '/api/tasks') {
			const row = await supa.createTask(body)
			return ok({ data: row }, 201)
		}
		// Priorities
		if (path === '/api/priorities') {
			const row = await supa.createPriority(body)
			return ok({ data: row }, 201)
		}
		
		// Generic handler for all other API routes
		if (path.startsWith('/api/')) {
			// Get the current session to include auth headers
			const { data: { session } } = await supabase.auth.getSession()
			const headers: HeadersInit = {
				'Content-Type': 'application/json',
			}
			
			if (session?.access_token) {
				headers['Authorization'] = `Bearer ${session.access_token}`
			}
			
			const resp = await fetch(path, {
				method: 'POST',
				headers,
				body: JSON.stringify(body),
			})
			const json = await resp.json().catch(() => undefined)
			return ok(json, resp.status)
		}
		
		throw new Error(`POST ${path} not implemented`)
	} catch (error) {
		return fail(error)
	}
}

async function routePut(path: string, body?: any) {
	try {
		const match = path.match(/^\/api\/events\/(\d+)$/)
		if (match) {
			const id = Number(match[1])
			// Get the current session to include auth headers
			const { data: { session } } = await supabase.auth.getSession()
			const headers: HeadersInit = {
				'Content-Type': 'application/json',
			}
			
			if (session?.access_token) {
				headers['Authorization'] = `Bearer ${session.access_token}`
			}
			
			const resp = await fetch(`/api/events/${id}`, {
				method: 'PUT',
				headers,
				body: JSON.stringify(body),
			})
			const json = await resp.json().catch(() => undefined)
			return ok(json, resp.status)
		}
		const liveGameEventMatch = path.match(/^\/api\/live-game-events\/(\d+)$/)
		if (liveGameEventMatch) {
			const eventId = Number(liveGameEventMatch[1])
			// Get the current session to include auth headers
			const { data: { session } } = await supabase.auth.getSession()
			const headers: HeadersInit = {
				'Content-Type': 'application/json',
			}
			
			if (session?.access_token) {
				headers['Authorization'] = `Bearer ${session.access_token}`
			}
			
			const resp = await fetch(`/api/live-game-events/${eventId}`, {
				method: 'PUT',
				headers,
				body: JSON.stringify(body),
			})
			const json = await resp.json().catch(() => undefined)
			return ok(json, resp.status)
		}
		// Player routes
		const playerMatch = path.match(/^\/api\/players\/(\d+)$/)
		if (playerMatch) {
			const id = Number(playerMatch[1])
			const row = await supa.updatePlayer(id, body)
			return ok({ data: row })
		}
		// Budgets
		const budgetMatch = path.match(/^\/api\/budgets\/(\d+)$/)
		if (budgetMatch) {
			const id = Number(budgetMatch[1])
			const row = await supa.updateBudget(id, body)
			return ok({ data: row })
		}
		// Expenses
		const expenseMatch = path.match(/^\/api\/expenses\/(\d+)$/)
		if (expenseMatch) {
			const id = Number(expenseMatch[1])
			const row = await supa.updateExpense(id, body)
			return ok({ data: row })
		}
		// Tasks
		const taskMatch = path.match(/^\/api\/tasks\/(\d+)$/)
		if (taskMatch) {
			const id = Number(taskMatch[1])
			const row = await supa.updateTask(id, body)
			return ok({ data: row })
		}
		// Games
		const gameMatch = path.match(/^\/api\/games\/(\d+)$/)
		if (gameMatch) {
			const id = Number(gameMatch[1])
			// Get the current session to include auth headers
			const { data: { session } } = await supabase.auth.getSession()
			const headers: HeadersInit = {
				'Content-Type': 'application/json',
			}
			
			if (session?.access_token) {
				headers['Authorization'] = `Bearer ${session.access_token}`
			}
			
			const resp = await fetch(`/api/games/${id}`, {
				method: 'PUT',
				headers,
				body: JSON.stringify(body),
			})
			const json = await resp.json().catch(() => undefined)
			return ok(json, resp.status)
		}
		// Game Stats
		const gameStatsMatch = path.match(/^\/api\/game-stats\/(\d+)$/)
		if (gameStatsMatch) {
			const id = Number(gameStatsMatch[1])
			// Get the current session to include auth headers
			const { data: { session } } = await supabase.auth.getSession()
			const headers: HeadersInit = {
				'Content-Type': 'application/json',
			}
			
			if (session?.access_token) {
				headers['Authorization'] = `Bearer ${session.access_token}`
			}
			
			const resp = await fetch(`/api/game-stats/${id}`, {
				method: 'PUT',
				headers,
				body: JSON.stringify(body),
			})
			const json = await resp.json().catch(() => undefined)
			return ok(json, resp.status)
		}
		
		// Generic handler for all other API routes
		if (path.startsWith('/api/')) {
			// Get the current session to include auth headers
			const { data: { session } } = await supabase.auth.getSession()
			const headers: HeadersInit = {
				'Content-Type': 'application/json',
			}
			
			if (session?.access_token) {
				headers['Authorization'] = `Bearer ${session.access_token}`
			}
			
			const resp = await fetch(path, {
				method: 'PUT',
				headers,
				body: JSON.stringify(body),
			})
			const json = await resp.json().catch(() => undefined)
			return ok(json, resp.status)
		}
		
		throw new Error(`PUT ${path} not implemented`)
	} catch (error) {
		return fail(error)
	}
}

async function routeDelete(path: string) {
	try {
		const match = path.match(/^\/api\/eventTypes\/(\d+)$/)
		if (match) {
			const id = Number(match[1])
			const row = await supa.deleteEventType(id)
			return ok({ data: row })
		}
		const liveGameEventMatch = path.match(/^\/api\/live-game-events\/(\d+)$/)
		if (liveGameEventMatch) {
			const eventId = Number(liveGameEventMatch[1])
			// Get the current session to include auth headers
			const { data: { session } } = await supabase.auth.getSession()
			const headers: HeadersInit = {
				'Content-Type': 'application/json',
			}
			
			if (session?.access_token) {
				headers['Authorization'] = `Bearer ${session.access_token}`
			}
			
			const resp = await fetch(`/api/live-game-events/${eventId}`, {
				method: 'DELETE',
				headers,
			})
			const json = await resp.json().catch(() => undefined)
			return ok(json, resp.status)
		}
		// Player routes
		const playerMatch = path.match(/^\/api\/players\/(\d+)$/)
		if (playerMatch) {
			const id = Number(playerMatch[1])
			const row = await supa.deletePlayer(id)
			return ok({ data: row })
		}
		// Player notes routes
		const noteMatch = path.match(/^\/api\/player-notes\/(\d+)$/)
		if (noteMatch) {
			const id = Number(noteMatch[1])
			const row = await supa.deletePlayerNote(id)
			return ok({ data: row })
		}
		// Player goals routes
		const goalMatch = path.match(/^\/api\/player-goals\/(\d+)$/)
		if (goalMatch) {
			const id = Number(goalMatch[1])
			const row = await supa.deletePlayerGoal(id)
			return ok({ data: row })
		}
		// Budgets
		const budgetMatch = path.match(/^\/api\/budgets\/(\d+)$/)
		if (budgetMatch) {
			const id = Number(budgetMatch[1])
			const row = await supa.deleteBudget(id)
			return ok({ data: row })
		}
		// Expenses
		const expenseMatch = path.match(/^\/api\/expenses\/(\d+)$/)
		if (expenseMatch) {
			const id = Number(expenseMatch[1])
			const row = await supa.deleteExpense(id)
			return ok({ data: row })
		}
		
		// Generic handler for all other API routes
		if (path.startsWith('/api/')) {
			// Get the current session to include auth headers
			const { data: { session } } = await supabase.auth.getSession()
			const headers: HeadersInit = {
				'Content-Type': 'application/json',
			}
			
			if (session?.access_token) {
				headers['Authorization'] = `Bearer ${session.access_token}`
			}
			
			const resp = await fetch(path, {
				method: 'DELETE',
				headers,
			})
			const json = await resp.json().catch(() => undefined)
			return ok(json, resp.status)
		}
		
		throw new Error(`DELETE ${path} not implemented`)
	} catch (error) {
		return fail(error)
	}
}

// Compose a default export that preserves SupabaseAPI methods and adds http-like helpers
const api = Object.assign(supa, {
	get: (path: string, config?: { params?: Record<string, any> }) => routeGet(path, config?.params),
	post: (path: string, data?: any) => routePost(path, data),
	put: (path: string, data?: any) => routePut(path, data),
	patch: (path: string, data?: any) => routePatch(path, data),
	delete: (path: string) => routeDelete(path),
})

// Error handler for global error management
export const setErrorHandler = (handler: (error: string) => void) => {
	window.addEventListener('error', (event) => {
		handler(event?.error?.message ?? String(event.error))
	})
	window.addEventListener('unhandledrejection', (event) => {
		handler(event?.reason?.message ?? String(event.reason))
	})
}

// Export the API instance
export default api

// Export specific API functions for convenience
export const {
	getEvents,
	getEvent,
	createEvent,
	updateEvent,
	deleteEvent,
	getEventTypes,
	createEventType,
	updateEventType,
	deleteEventType,
	getPlayers,
	getPlayer,
	createPlayer,
	updatePlayer,
	deletePlayer,
	getTasks,
	getTask,
	createTask,
	updateTask,
	deleteTask,
	getBudgets,
	getBudget,
	createBudget,
	updateBudget,
	deleteBudget,
	getExpenses,
	getExpense,
	createExpense,
	updateExpense,
	deleteExpense,
	getBudgetCategories,
	createBudgetCategory,
	updateBudgetCategory,
	deleteBudgetCategory
} = api