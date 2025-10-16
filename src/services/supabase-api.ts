import { supabase, createServerClient } from '@/lib/supabase'
import { Database } from '@/types/database'

type Tables = Database['public']['Tables']

export class SupabaseAPI {
    // Cache for user authentication to prevent excessive auth calls
    private userCache: { user: any; timestamp: number } | null = null
    private readonly USER_CACHE_DURATION = 30000 // 30 seconds

    private getClient() {
        // Prefer server client if available, but gracefully fall back to anon client
        if (typeof window === 'undefined') {
            try {
                return createServerClient()
            } catch (e) {
                console.warn('Service role client unavailable; falling back to anon client for server:', e)
                return supabase
            }
        }
        return supabase
    }

    // Get cached user or fetch new one
    private async getCachedUser() {
        const now = Date.now()
        
        // Return cached user if still valid
        if (this.userCache && (now - this.userCache.timestamp) < this.USER_CACHE_DURATION) {
            return this.userCache.user
        }
        
        // Check if we have a session first to avoid unnecessary auth calls
        const client = this.getClient()
        const { data: { session } } = await client.auth.getSession()
        
        if (!session) {
            console.warn('SupabaseAPI getCachedUser - no session available')
            this.userCache = { user: null, timestamp: now }
            return null
        }
        
        // Only fetch user if we have a valid session
        const { data: { user }, error } = await client.auth.getUser()
        
        if (error) {
            console.warn('SupabaseAPI getCachedUser - auth error:', error)
            this.userCache = { user: null, timestamp: now }
            return null
        }
        
        // Cache the user
        this.userCache = { user, timestamp: now }
        
        return user
    }

    // Get integer user ID from auth UUID for legacy tables
    private async getIntegerUserId(): Promise<number | null> {
        const user = await this.getCachedUser()
        if (!user) return null

        console.log('getIntegerUserId - user email:', user.email)

        try {
            // Try to find the user in the public.users table by email
            const { data, error } = await (supabase as any)
                .from('users')
                .select('id')
                .eq('email', user.email)
                .single()

            if (error) {
                console.warn('SupabaseAPI getIntegerUserId - user not found in public.users:', error)
                // Fallback: return 1 for the main LKRM user
                return 1
            }

            console.log('getIntegerUserId - found user:', data)
            return data?.id || 1
        } catch (error) {
            console.warn('SupabaseAPI getIntegerUserId - error:', error)
            // Fallback: return 1 for the main LKRM user
            return 1
        }
    }

    // Clear user cache (call when user logs out)
    public clearUserCache() {
        this.userCache = null
    }

    // Live-game sessions/events minimal API used by sync-service
    async getLiveGameSessions() {
        const client = this.getClient()
        const { data, error } = await (client as any)
            .from('live_game_sessions')
            .select('id, session_key, is_active, created_at')
            .order('created_at', { ascending: false })
        if (error) {
            console.warn('getLiveGameSessions error:', error)
            return []
        }
        return data || []
    }

    async createLiveGameEvent(event: {
        session_id: number
        game_id?: number
        player_id?: number
        event_type: string
        event_value?: number
        quarter: number
        is_opponent_event?: boolean
        opponent_jersey?: string
        metadata?: any
    }) {
        const client = this.getClient()
        const { error } = await (client as any)
            .from('live_game_events')
            .insert({
                session_id: event.session_id,
                game_id: event.game_id ?? null,
                player_id: event.player_id ?? null,
                event_type: event.event_type,
                event_value: event.event_value ?? null,
                quarter: event.quarter,
                is_opponent_event: event.is_opponent_event ?? false,
                opponent_jersey: event.opponent_jersey ?? null,
                metadata: event.metadata ?? null
            })
        if (error) {
            console.error('createLiveGameEvent error:', error)
            return false
        }
        return true
    }
	// Events
	async getEvents(params?: {
		page?: number
		perPage?: number
		startDate?: string
		endDate?: string
		name?: string
		eventTypeIds?: number[]
		location?: 'HOME' | 'AWAY'
		venue?: string
		sortBy?: string
		sortDirection?: 'asc' | 'desc'
	}) {
		console.log('Supabase getEvents called with params:', params)
		
		// For read-only operations, we don't need to check authentication
		// This prevents unnecessary auth calls that cause rate limiting
		const client = this.getClient()
		let query = (client as any)
			.from('events')
			.select(`
				*,
				event_types (
					id,
					name,
					color
				),
				event_coaches (
					coachUsername
				)
			`)

        // Apply sorting
        if (params?.sortBy) {
            const ascending = params?.sortDirection === 'asc'
            const sortBy = String(params.sortBy)
            // Map UI sort keys to actual columns (including joined tables)
            if (sortBy === 'event') {
                // Base table is events → sort directly by name
                query = query.order('name', { ascending })
            } else if (sortBy === 'priority') {
                // For events, interpret priority as event type name sorting
                query = (query as any).order('name', { foreignTable: 'event_types', ascending })
            } else {
                // Direct column sort
                query = query.order(sortBy, { ascending })
            }
        } else {
            // Default deterministic sorting for tasks views:
            // 1) Highest priority first (by task_priorities.weight desc)
            // 2) Upcoming event time first (events.startTime asc)
            // 3) Earliest due date first (dueDate asc)
            // 4) Newest created last for stability (createdAt desc)
            // Events default ordering: soonest first, then newest created for stability
            query = query
                .order('startTime', { ascending: true })
                .order('createdAt', { ascending: false })
        }

		console.log('Supabase getEvents - initial query built')

		// Apply filters
		if (params?.name) {
			query = query.ilike('name', `%${params.name}%`)
		}
		
		if (params?.startDate && params?.endDate) {
			query = query
				.gte('startTime', params.startDate)
				.lte('startTime', params.endDate)
		}
		
		if (params?.eventTypeIds && params.eventTypeIds.length > 0) {
			query = query.in('eventTypeId', params.eventTypeIds)
		}
		
		if (params?.location) {
			query = query.eq('location', params.location)
		}
		
		if (params?.venue) {
			query = query.ilike('venue', `%${params.venue}%`)
		}

		// Apply pagination
		if (params?.page && params?.perPage) {
			const from = (params.page - 1) * params.perPage
			const to = from + params.perPage - 1
			query = query.range(from, to)
		}

		console.log('Supabase getEvents - executing query...')
		const { data, error, count } = await query

		if (error) {
			console.error('Supabase getEvents - error:', error)
			throw error
		}

		// Normalize the event types structure
		let eventsWithTypes = data || []
		if (data && data.length > 0) {
			// Check if the join worked and we have event_types array
			if ((data as any)[0].event_types && Array.isArray((data as any)[0].event_types) && (data as any)[0].event_types.length > 0) {
				console.log('Supabase getEvents - join worked, normalizing structure')
				// Supabase join worked, convert event_types array to eventType object
				eventsWithTypes = (data as any).map((event: any) => ({
					...event,
					eventType: event.event_types?.[0], // Take the first (and should be only) event type
					// Remove the array for consumer convenience; keep type loose for TS
					event_types: undefined as any
				})) as any
			} else {
				console.log('Supabase getEvents - join failed, manually fetching event types')
				// Fetch all event types
				const { data: eventTypes, error: eventTypesError } = await (client as any)
					.from('event_types')
					.select('id, name, color')
				
				if (eventTypesError) {
					console.error('Supabase getEvents - error fetching event types:', eventTypesError)
				} else {
					// Create a map of event type IDs to event type objects
					const eventTypesMap = new Map((eventTypes as any[]).map((et: any) => [et.id, et]))
					
					// Manually combine events with their event types
					eventsWithTypes = (data as any).map((event: any) => ({
						...event,
						eventType: eventTypesMap.get(event.eventTypeId)
					})) as any
				}
			}
		}

		console.log('Supabase getEvents result:', { data: eventsWithTypes, error, count })
		console.log('Supabase getEvents params:', params)
		console.log('Supabase getEvents - data length:', eventsWithTypes?.length)
		console.log('Supabase getEvents - first item:', eventsWithTypes?.[0])

		return {
			data: eventsWithTypes || [],
			meta: {
				total: count || 0,
				page: params?.page || 1,
				perPage: params?.perPage || 20
			}
		}
	}



	async getEvent(id: number) {
		const { data, error } = await (this.getClient() as any)
			.from('events')
			.select(`
				*,
				event_types (
					id,
					name,
					color
				)
			`)
			.eq('id', id)
			.single()

		if (error) throw error
		return data
	}

	async createEventWithUser(eventData: {
		name: string
		description?: string
		eventTypeId: number
		startTime: string
		endTime?: string
		location?: string // Made optional for meetings
		venue: string
		oppositionTeam?: string
		isRepeat?: boolean
		occurence?: number
		repeatType?: 'daily' | 'weekly' | 'monthly' | 'yearly'
		daysOfWeek?: number[]
		isNotice?: boolean
		notes?: string
	}, userId: string, client?: any) {
		console.log('SupabaseAPI.createEventWithUser - Starting with eventData:', eventData, 'userId:', userId)
		
		// Use the auth user ID (UUID) directly since we're now storing UUIDs in createdBy/updatedBy
		const createdByUserId = userId

		// Use the actual database column names from the schema (camelCase as per DATABASE_FIELD_MAPPING.md)
		const transformedData: any = {
			name: eventData.name,
			description: eventData.description,
			eventTypeId: eventData.eventTypeId,
			startTime: eventData.startTime,
			endTime: eventData.endTime,
			venue: eventData.venue,
			oppositionTeam: eventData.oppositionTeam,
			isRepeat: eventData.isRepeat || false,
			occurence: eventData.occurence || 0,
			repeatType: eventData.repeatType,
			daysOfWeek: eventData.daysOfWeek,
			isNotice: eventData.isNotice || false,
			notes: eventData.notes,
			createdBy: createdByUserId, // Now using UUID
			updatedBy: createdByUserId, // Now using UUID
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString()
		}

		// Only include location if it's provided (not for meetings)
		if (eventData.location) {
			transformedData.location = eventData.location // This should be 'HOME' or 'AWAY'
		}

		console.log('SupabaseAPI.createEventWithUser - Original event data:', eventData)
		console.log('SupabaseAPI.createEventWithUser - Transformed event data:', transformedData)
		console.log('SupabaseAPI.createEventWithUser - Auth user ID (UUID):', userId)
		console.log('SupabaseAPI.createEventWithUser - UUID for createdBy:', createdByUserId)
		console.log('SupabaseAPI.createEventWithUser - Location field value:', eventData.location || 'NOT_PROVIDED')
		console.log('SupabaseAPI.createEventWithUser - Location field type:', typeof eventData.location)

		try {
			console.log('SupabaseAPI.createEventWithUser - Attempting to insert into events table...')
			const supabaseClient = client || this.getClient()
			const { data, error } = await (supabaseClient as any)
				.from('events')
				.insert(transformedData)
				.select(`
					*,
					event_types (
						id,
						name,
						color
					)
				`)
				.single()

			console.log('SupabaseAPI.createEventWithUser - Insert result:', { data, error })

			if (error) {
				console.error('SupabaseAPI.createEventWithUser - Supabase insert error (events):', {
					message: (error as any).message,
					code: (error as any).code,
					details: (error as any).details,
					hint: (error as any).hint,
					fullError: error
				})
				throw error
			}
			return data
		} catch (err) {
			console.error('SupabaseAPI.createEventWithUser - Error in createEventWithUser:', {
				error: err,
				errorType: typeof err,
				errorKeys: err ? Object.keys(err) : 'No keys',
				errorMessage: err instanceof Error ? err.message : 'Not an Error instance',
				errorStack: err instanceof Error ? err.stack : 'No stack trace'
			})
			throw err
		}
	}

	async deleteEvent(id: number) {
		const client = this.getClient()
		const { data, error } = await (client as any)
			.from('events')
			.delete()
			.eq('id', id)

		if (error) throw error
		return { success: true, data }
	}

	// Game stats helpers (minimal implementations)
	async getGameStatsByEvent(eventId: number) {
		const client = this.getClient()
		const { data, error } = await (client as any)
			.from('game_stats')
			.select('*')
			.eq('eventId', eventId)
		if (error) throw error
		return data || []
	}

	async getGameStatsByGame(gameId: number) {
		const client = this.getClient()
		const { data, error } = await (client as any)
			.from('game_stats')
			.select('*')
			.eq('gameId', gameId)
		if (error) throw error
		return data || []
	}

	async createOrUpdateGameStat(payload: any) {
		const client = this.getClient()
		const { data, error } = await (client as any)
			.from('game_stats')
			.upsert([payload])
			.select()
			.single()
		if (error) throw error
		return data
	}

	async updateGameStat(id: number, payload: any) {
		const client = this.getClient()
		const { data, error } = await (client as any)
			.from('game_stats')
			.update(payload)
			.eq('id', id)
			.select()
			.single()
		if (error) throw error
		return data
	}

	async deleteGameStat(id: number) {
		const client = this.getClient()
		const { error } = await (client as any)
			.from('game_stats')
			.delete()
			.eq('id', id)
		if (error) throw error
		return { success: true }
	}

	async getGamesByEvent(eventId: number) {
		const client = this.getClient()
		const { data, error } = await (client as any)
			.from('games')
			.select('*')
			.eq('eventId', eventId)
		if (error) throw error
		return data || []
	}

	async createGame(payload: any) {
		const client = this.getClient()
		const { data, error } = await (client as any)
			.from('games')
			.insert([payload])
			.select()
			.single()
		if (error) throw error
		return data
	}

	async updateGame(id: number, payload: any) {
		const client = this.getClient()
		const { data, error } = await (client as any)
			.from('games')
			.update(payload)
			.eq('id', id)
			.select()
			.single()
		if (error) throw error
		return data
	}

	async deleteGame(id: number) {
		const client = this.getClient()
		const { error } = await (client as any)
			.from('games')
			.delete()
			.eq('id', id)
		if (error) throw error
		return { success: true }
	}

	async createEvent(eventData: {
		name: string
		description?: string
		eventTypeId: number
		startTime: string
		endTime?: string
		location: string
		venue: string
		oppositionTeam?: string
		isRepeat?: boolean
		occurence?: number
		repeatType?: 'daily' | 'weekly' | 'monthly' | 'yearly'
		isNotice?: boolean
		notes?: string
	}) {
		console.log('SupabaseAPI.createEvent - Starting with eventData:', eventData)
		
		const user = await this.getCachedUser()
		console.log('SupabaseAPI.createEvent - Auth user:', user)
		
		if (!user) throw new Error('Not authenticated')

		// Use authenticated user data directly (auth.users table approach)
		let createdByUserId = JSON.stringify({
			id: user.id,
			email: user.email,
			name: user.user_metadata?.first_name && user.user_metadata?.last_name 
				? `${user.user_metadata.first_name} ${user.user_metadata.last_name}`
				: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Unknown'
		})
		
		console.log('SupabaseAPI.createEvent - Using authenticated user data:', createdByUserId)

		// Use the actual database column names from the schema (camelCase as per DATABASE_FIELD_MAPPING.md)
		const transformedData: any = {
			name: eventData.name,
			description: eventData.description,
			eventTypeId: eventData.eventTypeId,
			startTime: eventData.startTime,
			endTime: eventData.endTime,
			location: eventData.location, // This should be 'HOME' or 'AWAY'
			venue: eventData.venue,
			oppositionTeam: eventData.oppositionTeam,
			isRepeat: eventData.isRepeat || false,
			occurence: eventData.occurence || 0,
			isNotice: eventData.isNotice || false,
			notes: eventData.notes,
			createdBy: createdByUserId,
			updatedBy: createdByUserId,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString()
		}

		// Only add repeatType if it's provided (after migration is applied)
		if (eventData.repeatType) {
			transformedData.repeatType = eventData.repeatType
		}

		console.log('SupabaseAPI.createEvent - Original event data:', eventData)
		console.log('SupabaseAPI.createEvent - Transformed event data:', transformedData)
		console.log('SupabaseAPI.createEvent - Supabase user ID (UUID):', user.id)
		console.log('SupabaseAPI.createEvent - Integer user ID for createdBy:', createdByUserId)
		console.log('SupabaseAPI.createEvent - Location field value:', eventData.location)
		console.log('SupabaseAPI.createEvent - Location field type:', typeof eventData.location)

		try {
			console.log('SupabaseAPI.createEvent - Attempting to insert into events table...')
			const { data, error } = await (supabase as any)
				.from('events')
				.insert(transformedData)
				.select(`
					*,
					event_types (
						id,
						name,
						color
					)
				`)
				.single()

			console.log('SupabaseAPI.createEvent - Insert result:', { data, error })

			if (error) {
				console.error('SupabaseAPI.createEvent - Supabase insert error (events):', {
					message: (error as any).message,
					code: (error as any).code,
					details: (error as any).details,
					hint: (error as any).hint,
					fullError: error
				})
				throw error
			}
			return data
		} catch (err) {
			console.error('SupabaseAPI.createEvent - Error in createEvent:', {
				error: err,
				errorType: typeof err,
				errorKeys: err ? Object.keys(err) : 'No keys',
				errorMessage: err instanceof Error ? err.message : 'Not an Error instance',
				errorStack: err instanceof Error ? err.stack : 'No stack trace'
			})
			throw err
		}
	}

	async updateEvent(id: number, eventData: Tables['events']['Update']) {
		const { data, error } = await (this.getClient() as any)
			.from('events')
			.update({
				...eventData,
				updatedAt: new Date().toISOString()
			})
			.eq('id', id)
			.select(`
				*,
				event_types (
					id,
					name,
					color
				)
			`)
			.single()

		if (error) throw error
		return data
	}

	// Tasks
	async getTasks(params?: {
		page?: number
		perPage?: number
		eventId?: number
		status?: string
		priorityId?: number
		name?: string
		startDate?: string
		endDate?: string
		dueDate?: string
	}) {
		console.log('Supabase getTasks called with params:', params)
		
		let query = (this.getClient() as any)
			.from('tasks')
			.select(`
				*,
				task_priorities (
					id,
					name,
					weight,
					color
				),
				events (
					id,
					name,
					venue
				)
			`)
			.order('createdAt', { ascending: false })

		console.log('Supabase getTasks - initial query built')

		// Apply filters
		if (params?.name) {
			query = query.ilike('name', `%${params.name}%`)
		}
		
		if (params?.eventId) {
			query = query.eq('eventId', params.eventId)
		}
		
		if (params?.status) {
			query = query.eq('status', params.status as any)
		}
		
		if (params?.priorityId) {
			query = query.eq('priorityId', params.priorityId)
		}
		
		if (params?.dueDate) {
			query = query.eq('dueDate', params.dueDate)
		}

		// Apply pagination
		if (params?.page && params?.perPage) {
			const from = (params.page - 1) * params.perPage
			const to = from + params.perPage - 1
			query = query.range(from, to)
		}

		console.log('Supabase getTasks - executing query...')
		const { data, error, count } = await query

		if (error) {
			console.error('Supabase getTasks - error:', error)
			console.error('Supabase getTasks - error details:', JSON.stringify(error, null, 2))
			console.error('Supabase getTasks - error code:', error.code)
			console.error('Supabase getTasks - error message:', error.message)
			console.error('Supabase getTasks - error hint:', error.hint)
			throw error
		}

		console.log('Supabase getTasks result:', { data, error, count })
		console.log('Supabase getTasks params:', params)
		console.log('Supabase getTasks - data length:', data?.length)
		console.log('Supabase getTasks - first item:', data?.[0])

		return {
			data: data || [],
			meta: {
				total: count || 0,
				page: params?.page || 1,
				perPage: params?.perPage || 20
			}
		}
	}

	async createTask(taskData: any & { playerIds?: number[] }) {
		const user = await this.getCachedUser()
		if (!user) throw new Error('Not authenticated')

		console.log('Creating task for user:', user.id)
		console.log('Original task data:', JSON.stringify(taskData, null, 2))

		const { playerIds, ...taskFields } = taskData

		// Use authenticated user data for createdBy and updatedBy (auth.users table)
		const userEmail = user.email
		const userName = user.user_metadata?.first_name && user.user_metadata?.last_name 
			? `${user.user_metadata.first_name} ${user.user_metadata.last_name}`
			: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Unknown'
		
		// Store user info as JSON string for createdBy and updatedBy
		const userData = JSON.stringify({
			email: userEmail,
			name: userName,
			id: user.id
		})
		
		console.log('Using authenticated user for task creation:', userEmail, user.id)

		// Map to actual database column names (camelCase, matching your Supabase schema)
		const mappedTaskData = {
			name: taskFields.name,
			description: taskFields.description,
			dueDate: taskFields.dueDate,
			priorityId: taskFields.priorityId,
			status: taskFields.status || 'TODO',
			eventId: taskFields.eventId,
			assigneeId: taskFields.assigneeId || null,
			createdBy: userData,
			updatedBy: userData
		}

		console.log('Mapped task data:', JSON.stringify(mappedTaskData, null, 2))

		// Create the task
		const { data: task, error: taskError } = await (this.getClient() as any)
			.from('tasks')
			.insert(mappedTaskData)
			.select()
			.single()

		if (taskError) {
			console.error('Task creation error:', taskError)
			console.error('Error details:', JSON.stringify(taskError, null, 2))
			throw taskError
		}

		// Player task assignments removed for now - focus on basic task creation

		// Return the complete task with relations
		return this.getTaskById(task.userId) // Note: using userId since that's the primary key name
	}

	async updateTask(id: number, taskData: any & { playerIds?: number[] }) {
		const { playerIds, ...taskFields } = taskData

		// Map to actual database column names (camelCase, matching your Supabase schema)
		const mappedTaskData = {
			name: taskFields.name,
			description: taskFields.description,
			dueDate: taskFields.dueDate,
			priorityId: taskFields.priorityId,
			status: taskFields.status,
			eventId: taskFields.eventId
		}

		// Update the task
		const { data: task, error: taskError } = await (supabase as any)
			.from('tasks')
			.update(mappedTaskData)
			.eq('userId', id)
			.select()
			.single()

		if (taskError) throw taskError

		// Player task assignments removed for now - focus on basic task updates

		return this.getTaskById(id)
	}

	async getTaskById(id: number) {
		const { data, error } = await (this.getClient() as any)
			.from('tasks')
			.select(`
				*,
				task_priorities (
					id,
					name,
					weight,
					color
				),
				events (
					id,
					name
				)
			`)
			.eq('userId', id)
			.single()

		if (error) throw error
		return data
	}

	// Players
	async getPlayers(params?: {
		page?: number
		perPage?: number
		name?: string
		positionIds?: number[]
		schoolYear?: string
	}) {
		console.log('Supabase getPlayers called with params:', params)

		// First, try to get players with notes and goals
		const clientAny = this.getClient() as any
		let query = clientAny
			.from('players')
			.select(`
				*,
				position:positions(id, name, abbreviation)
			`)
			.order('first_name', { ascending: true })

		// Hide archived by default
		query = query.eq('is_active', true)

		if (params?.name) {
			query = query.or(`first_name.ilike.%${params.name}%,last_name.ilike.%${params.name}%`)
		}

		if (params?.positionIds) {
			const ids = Array.isArray(params.positionIds)
				? params.positionIds
				: String(params.positionIds).split(',').map((v) => Number(v)).filter((v) => !Number.isNaN(v))
			if (ids.length > 0) {
				query = query.in('positionId', ids)
			}
		}

		if (params?.schoolYear) {
			query = query.eq('school_year', params.schoolYear)
		}

		if (params?.page && params?.perPage) {
			const from = (params.page - 1) * params.perPage
			const to = from + params.perPage - 1
			query = query.range(from, to)
		}

		console.log('Supabase getPlayers - executing query...')
		let { data, error } = await query
		if (error) {
			console.error('Supabase getPlayers - error:', error)
			throw error
		}

		// Now fetch notes and goals separately for each player
		if (data && Array.isArray(data) && data.length > 0) {
			try {
				const playerIds = data.map((p: any) => p.id)
				
				// Fetch notes for all players - use correct field names from actual database
				const { data: notesData, error: notesError } = await (this.getClient() as any)
					.from('player_notes')
					.select('id, player_id, note_text, created_at')
					.in('player_id', playerIds)
					.order('created_at', { ascending: false })

				// Fetch goals for all players - use correct field names from actual database
				const { data: goalsData, error: goalsError } = await (this.getClient() as any)
					.from('player_goals')
					.select('id, player_id, goal_text, created_at')
					.in('player_id', playerIds)
					.order('created_at', { ascending: false })

				if (!notesError && notesData) {
					// Group notes by player_id
					const notesByPlayer = notesData.reduce((acc: any, note: any) => {
						if (!acc[note.player_id]) acc[note.player_id] = []
						acc[note.player_id].push({
							...note,
							note: note.note_text || 'No content',
							note_text: note.note_text // Keep original field
						})
						return acc
					}, {})

					// Attach notes to players
					data = data.map((player: any) => ({
						...player,
						notes: notesByPlayer[player.id] || []
					}))
				}

				if (!goalsError && goalsData) {
					// Group goals by player_id
					const goalsByPlayer = goalsData.reduce((acc: any, goal: any) => {
						if (!acc[goal.player_id]) acc[goal.player_id] = []
						acc[goal.player_id].push({
							...goal,
							goal: goal.goal_text || 'No content',
							goal_text: goal.goal_text // Keep original field
						})
						return acc
					}, {})

					// Attach goals to players
					data = data.map((player: any) => ({
						...player,
						goals: goalsByPlayer[player.id] || []
					}))
				}

				console.log('Supabase getPlayers - notes and goals attached successfully')
			} catch (relationError) {
				console.warn('Supabase getPlayers - failed to fetch notes/goals:', relationError)
				// Continue without notes/goals if they fail
				data = data.map((player: any) => ({
					...player,
					notes: [],
					goals: []
				}))
			}
		}

		// Ensure position info exists even if relation fails by enriching from positions table
		if (data && Array.isArray(data) && data.length > 0) {
			const needsPositions = (data as any[]).some((p) => !p.position && (p.positionId != null || p.position_id != null))
			if (needsPositions) {
				const client = this.getClient() as any
				const { data: posList, error: posErr } = await client
					.from('positions')
					.select('id, name')
				if (!posErr && posList) {
					const idToName = new Map<number, string>(posList.map((r: any) => [r.id, r.name]))
					data = (data as any[]).map((p) => {
						const pid = p.positionId ?? p.position_id
						if (!p.position && pid != null) {
							return { ...p, position: { id: pid, name: idToName.get(pid) || '' } }
						}
						return p
					}) as any
				}
			}
		}

		console.log('Supabase getPlayers result:', { data, error })
		console.log('Supabase getPlayers - data length:', data?.length)
		
		return data || []
	}

	async getPlayer(id: number) {
		console.log('Supabase getPlayer called with id:', id)
		
		const { data, error } = await (this.getClient() as any)
			.from('players')
			.select(`
				*,
				position:positions(id, name, abbreviation)
			`)
			.eq('id', id)
			.eq('isActive', true)
			.single()
		
		if (error) {
			console.error('Supabase getPlayer - error:', error)
			throw error
		}
		
		console.log('Supabase getPlayer result:', { data, error })
		return data
	}

	async createPlayer(playerData: any) {
		const user = await this.getCachedUser()
		if (!user) throw new Error('Not authenticated')

		// Clean the player data to only include valid fields that exist in the database
		const cleanPlayerData = {
			name: playerData.name,  // Include name since database still requires it
			first_name: playerData.firstName || playerData.name?.split(' ')[0],  // Use database column name
			last_name: playerData.lastName || playerData.name?.split(' ')[1] || '',  // Use database column name
			positionId: playerData.position_id,  // Use the actual column name from your database
			jersey: playerData.jersey_number,  // Use the old jersey column (NOT NULL constraint)
			jersey_number: playerData.jersey_number,  // Also populate the new column for consistency
			user_id: user.id,  // Required by RLS policies (UUID) - use underscore format
			updatedBy: 1,  // Required by database constraint (integer) - TEMPORARY FIX
			profile_id: 1,  // Required by database constraint (integer) - TEMPORARY FIX
			// Optional fields that exist in the database
			...(playerData.school_year && { school_year: playerData.school_year }),
		}

		console.log('Creating player with data:', cleanPlayerData)
		console.log('User ID:', user.id)
		console.log('Supabase client:', !!supabase)

		try {
			const { data, error } = await (supabase as any)
				.from('players')
				.insert(cleanPlayerData)
				.select()
				.single()

			if (error) {
				console.error('Supabase insert error details:', {
					message: (error as any).message,
					code: (error as any).code,
					details: (error as any).details,
					hint: (error as any).hint,
					fullError: error
				})
				throw error
			}

			console.log('Player created successfully:', data)
			return data
		} catch (error) {
			console.error('Error in createPlayer - Full error object:', error)
			console.error('Error type:', typeof error)
			console.error('Error keys:', error ? Object.keys(error) : 'No keys')
			if (error && typeof error === 'object' && 'message' in error && 'code' in error) {
				console.error('Error message:', (error as any).message)
				console.error('Error code:', (error as any).code)
			}
			throw error
		}
	}

	async updatePlayer(id: number, playerData: any) {
		const user = await this.getCachedUser()
		if (!user) throw new Error('Not authenticated')

		// Clean the player data to match database schema
		const cleanPlayerData = {
			name: playerData.name,
			first_name: playerData.firstName,
			last_name: playerData.lastName,
			positionId: playerData.position_id,
			jersey: playerData.jersey_number,  // For the NOT NULL jersey column
			jersey_number: playerData.jersey_number,
			...(playerData.school_year && { school_year: playerData.school_year }),
			updatedBy: 1, // Required by database constraint
		}

		console.log('Updating player with data:', cleanPlayerData)

		const { data, error } = await (this.getClient() as any)
			.from('players')
			.update(cleanPlayerData)
			.eq('id', id)
			.eq('user_id', user.id)  // Use underscore format
			.select(`
				*,
				position:positions(id, name, abbreviation)
			`)
			.single()

		if (error) {
			console.error('Supabase update player error:', error)
			throw error
		}
		
		console.log('Player updated successfully:', data)
		return data
	}

	async deletePlayer(id: number) {
		const user = await this.getCachedUser()
		if (!user) throw new Error('Not authenticated')

		const { data, error } = await (this.getClient() as any)
			.from('players')
			.update({ 
				isActive: false,
				is_active: false,  // Also update the newer field
				updatedAt: new Date().toISOString(),
				updated_at: new Date().toISOString()
			})
			.eq('id', id)
			.select()
			.single()

		if (error) throw error
		return data
	}

	// Player Notes
	async getPlayerNotes(playerId: number) {
		console.log('Getting player notes for player ID:', playerId)
		
		const { data, error } = await (supabase as any)
			.from('player_notes')
			.select('*')
			.eq('player_id', playerId)
			.order('created_at', { ascending: false })

		if (error) {
			console.error('Error fetching player notes:', error)
			throw error
		}

		// Manually fetch user data for each note
		const notesWithUsers = await Promise.all(
			(data || []).map(async (note: any) => {
				try {
					const { data: userData } = await (supabase as any)
						.from('users')
						.select('id, username, email')
						.eq('id', note.createdBy)
						.single()
					
					return {
						...note,
						createdUser: userData
					}
				} catch (userError) {
					console.warn('Could not fetch user for note:', note.id, userError)
					return note
				}
			})
		)

		console.log('Retrieved player notes with users:', notesWithUsers)
		return notesWithUsers
	}

	async createPlayerNote(noteData: {
		playerId: number
		noteText: string
	}) {
		const user = await this.getCachedUser()
		if (!user) throw new Error('Not authenticated')

		const integerUserId = await this.getIntegerUserId()
		if (!integerUserId) throw new Error('Could not resolve user ID')

		console.log('Creating player note with data:', {
			player_id: noteData.playerId,
			note_text: noteData.noteText,
			user_id: user.id,
			integer_user_id: integerUserId,
			user: user
		})

		const insertData = {
			// New Supabase fields
			player_id: noteData.playerId,
			note_text: noteData.noteText,
			user_id: user.id,
			created_at: new Date().toISOString(),
			
			// Old Prisma fields (also required)
			playerId: noteData.playerId,
			note: noteData.noteText,
			isPublic: false,
			tags: [],
			createdBy: integerUserId,
			updatedBy: integerUserId,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString()
		}

		console.log('Inserting note data:', insertData)

		const { data, error } = await (supabase as any)
			.from('player_notes')
			.insert(insertData)
			.select()
			.single()

		if (error) {
			console.error('Supabase player note insert error:', error)
			console.error('Error details:', {
				message: (error as any).message,
				code: (error as any).code,
				details: (error as any).details,
				hint: (error as any).hint,
				fullError: error
			})
			throw error
		}

		console.log('Player note created successfully:', data)
		return data
	}

	async deletePlayerNote(id: number) {
		const user = await this.getCachedUser()
		if (!user) throw new Error('Not authenticated')

		const integerUserId = await this.getIntegerUserId()
		console.log('Delete note - integerUserId:', integerUserId, 'for note id:', id)
		
		if (!integerUserId) throw new Error('Could not resolve user ID')

		const { data, error } = await (supabase as any)
			.from('player_notes')
			.delete()
			.eq('id', id)
			.eq('createdBy', integerUserId)
			.select()
			.single()

		if (error) {
			console.error('Delete note error:', error)
			throw error
		}
		
		console.log('Note deleted successfully:', data)
		return data
	}

	// Player Goals
	async getPlayerGoals(playerId: number) {
		console.log('Getting player goals for player ID:', playerId)
		
		const { data, error } = await (supabase as any)
			.from('player_goals')
			.select('*')
			.eq('player_id', playerId)
			.order('created_at', { ascending: false })

		if (error) {
			console.error('Error fetching player goals:', error)
			throw error
		}

		// Manually fetch user data for each goal
		const goalsWithUsers = await Promise.all(
			(data || []).map(async (goal: any) => {
				try {
					const { data: userData } = await (supabase as any)
						.from('users')
						.select('id, username, email')
						.eq('id', goal.createdBy)
						.single()
					
					return {
						...goal,
						createdUser: userData
					}
				} catch (userError) {
					console.warn('Could not fetch user for goal:', goal.id, userError)
					return goal
				}
			})
		)

		console.log('Retrieved player goals with users:', goalsWithUsers)
		return goalsWithUsers
	}

	async createPlayerGoal(goalData: {
		playerId: number
		goalText: string
	}) {
		const user = await this.getCachedUser()
		if (!user) throw new Error('Not authenticated')

		const integerUserId = await this.getIntegerUserId()
		if (!integerUserId) throw new Error('Could not resolve user ID')

		console.log('Creating player goal with data:', {
			player_id: goalData.playerId,
			goal_text: goalData.goalText,
			user_id: user.id,
			integer_user_id: integerUserId,
			user: user
		})

		const insertData = {
			// New Supabase fields
			player_id: goalData.playerId,
			goal_text: goalData.goalText,
			user_id: user.id,
			created_at: new Date().toISOString(),
			
			// Old Prisma fields (also required)
			playerId: goalData.playerId,
			goal: goalData.goalText,
			isAchieved: false,
			category: null,
			createdBy: integerUserId,
			updatedBy: integerUserId,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString()
		}

		console.log('Inserting goal data:', insertData)

		const { data, error } = await (supabase as any)
			.from('player_goals')
			.insert(insertData)
			.select()
			.single()

		if (error) {
			console.error('Supabase player goal insert error:', error)
			console.error('Error details:', {
				message: (error as any).message,
				code: (error as any).code,
				details: (error as any).details,
				hint: (error as any).hint
			})
			throw error
		}

		console.log('Player goal created successfully:', data)
		return data
	}

	async deletePlayerGoal(id: number) {
		const user = await this.getCachedUser()
		if (!user) throw new Error('Not authenticated')

		const integerUserId = await this.getIntegerUserId()
		console.log('Delete goal - integerUserId:', integerUserId, 'for goal id:', id)
		
		if (!integerUserId) throw new Error('Could not resolve user ID')

		const { data, error } = await (supabase as any)
			.from('player_goals')
			.delete()
			.eq('id', id)
			.eq('createdBy', integerUserId)
			.select()
			.single()

		if (error) {
			console.error('Delete goal error:', error)
			throw error
		}
		
		console.log('Goal deleted successfully:', data)
		return data
	}

	async checkDatabaseSchema() {
		try {
			// Try to get a single player to see the schema
			const { data, error } = await (supabase as any)
				.from('players')
				.select('*')
				.limit(1)

			if (error) {
				console.error('Error checking players table schema:', error)
				return null
			}

			console.log('Players table schema check - sample data:', data)
			return data
		} catch (error) {
			console.error('Exception checking database schema:', error)
			return null
		}
	}

	// Metadata
	async getEventTypes() {
		const { data, error } = await (supabase as any)
			.from('event_types')
			.select('*')
			.order('name', { ascending: true })

		if (error) throw error
		return data || []
	}

	async getPositions(): Promise<{ id: number; name: string; abbreviation?: string }[]> {
		const { data, error } = await (supabase as any)
			.from('positions')
			.select('*')
			.order('name', { ascending: true })

		if (error) throw error
		
		// If no positions exist, seed with default ones
		if (!data || data.length === 0) {
			console.log('No positions found, seeding default positions...')
			await this.seedPositions()
			// Fetch again after seeding
			const { data: seededData, error: seededError } = await (supabase as any)
				.from('positions')
				.select('*')
				.order('name', { ascending: true })
			
			if (seededError) throw seededError
			return seededData || []
		}
		
		return (data || []) as { id: number; name: string; abbreviation?: string }[]
	}

	async seedPositions() {
		const defaultPositions = [
			{ name: 'Center', abbreviation: 'C' },
			{ name: 'Guard', abbreviation: 'G' },
			{ name: 'Forward', abbreviation: 'F' }
		]

		console.log('Seeding positions with:', defaultPositions)

		const { data, error } = await (supabase as any)
			.from('positions')
			.insert(defaultPositions)
			.select()

		if (error) {
			console.error('Error seeding positions:', error)
			throw error
		}
		
		console.log('Positions seeded successfully:', data)
		return data
	}

	async getPriorities() {
		const { data, error } = await (supabase as any)
			.from('task_priorities')
			.select('*')
			.order('weight', { ascending: true })

		if (error) throw error
		return data || []
	}

	async createPriority(priorityData: any) {
		const user = await this.getCachedUser()
		if (!user) throw new Error('Not authenticated')

		const { data, error } = await (supabase as any)
			.from('task_priorities')
			.insert({
				...priorityData,
				createdBy: 1, // Default user ID for now
				updatedBy: 1, // Default user ID for now
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString()
			})
			.select()
			.single()

		if (error) throw error
		return data
	}

	// Profile
	async getProfile() {
		const user = await this.getCachedUser()
		if (!user) throw new Error('Not authenticated')

		const { data, error } = await (supabase as any)
			.from('profiles')
			.select('*')
			.eq('id', user.id)
			.single()

		if (error) throw error
		return data
	}

	async updateProfile(profileData: any) {
		const user = await this.getCachedUser()
		if (!user) throw new Error('Not authenticated')

		const { data, error } = await (supabase as any)
			.from('profiles')
			.update({
				...profileData,
				updatedAt: new Date().toISOString()
			})
			.eq('id', user.id)
			.select()
			.single()

		if (error) throw error
		return data
	}

	// Event Types
	async createEventType(eventTypeData: any) {
		const user = await this.getCachedUser()
		if (!user) throw new Error('Not authenticated')

		const { data, error } = await (supabase as any)
			.from('event_types')
			.insert(eventTypeData)
			.select()
			.single()

		if (error) throw error
		return data
	}

	async updateEventType(id: number, eventTypeData: any) {
		const { data, error } = await (supabase as any)
			.from('event_types')
			.update(eventTypeData)
			.eq('id', id)
			.select()
			.single()

		if (error) throw error
		return data
	}

	async deleteEventType(id: number) {
		const { data, error } = await (supabase as any)
			.from('event_types')
			.delete()
			.eq('id', id)
			.select()
			.single()

		if (error) throw error
		return data
	}

	// Tasks
	async getTask(id: number) {
		return this.getTaskById(id)
	}

	async deleteTask(id: number) {
		const user = await this.getCachedUser()
		if (!user) throw new Error('Not authenticated')

		const { data, error } = await (supabase as any)
			.from('tasks')
			.update({ 
				isActive: false,
				updatedAt: new Date().toISOString()
			})
			.eq('userId', id)
			.eq('createdBy', user.id)
			.select()
			.single()

		if (error) throw error
		return data
	}

	// Budget Categories
	async getBudgetCategories() {
		const { data, error } = await (supabase as any)
			.from('budget_categories')
			.select('*')
			.order('name');
		
		if (error) throw error;
		return data;
	}

	async createBudgetCategory(categoryData: any) {
		const user = await this.getCachedUser();
		if (!user) throw new Error('Not authenticated');

		const cleanCategoryData = {
			name: categoryData.name,
			description: categoryData.description,
			color: categoryData.color || '#1890ff',
			createdBy: 1, // TODO: Map to actual user ID
			updatedBy: 1, // TODO: Map to actual user ID
		};

		const { data, error } = await (supabase as any)
			.from('budget_categories')
			.insert(cleanCategoryData)
			.select()
			.single();

		if (error) throw error;
		return data;
	}

	async updateBudgetCategory(id: number, categoryData: any) {
		const user = await this.getCachedUser();
		if (!user) throw new Error('Not authenticated');

		const cleanCategoryData = {
			name: categoryData.name,
			description: categoryData.description,
			color: categoryData.color,
			updatedBy: 1, // TODO: Map to actual user ID
		};

		const { data, error } = await (supabase as any)
			.from('budget_categories')
			.update(cleanCategoryData)
			.eq('id', id)
			.select()
			.single();

		if (error) throw error;
		return data;
	}

	async deleteBudgetCategory(id: number) {
		const user = await this.getCachedUser();
		if (!user) throw new Error('Not authenticated');

		const { error } = await (supabase as any)
			.from('budget_categories')
			.delete()
			.eq('id', id);

		if (error) throw error;
		return { success: true };
	}

	// Budgets
	async getBudgets(params?: any) {
		let query = (supabase as any)
			.from('budgets')
			.select(`
				*,
				category:budget_categories(id, name, color)
			`)
			.order('createdAt', { ascending: false });

		if (params?.name) {
			query = query.ilike('name', `%${params.name}%`);
		}

		const { data, error } = await query;
		if (error) throw error;
		return data;
	}

	async getBudget(id: number) {
		const { data, error } = await (supabase as any)
			.from('budgets')
			.select(`
				*,
				category:budget_categories(id, name, color)
			`)
			.eq('id', id)
			.single();

		if (error) throw error;
		return data;
	}

	async createBudget(budgetData: any) {
		const user = await this.getCachedUser();
		if (!user) throw new Error('Not authenticated');

		const cleanBudgetData = {
			name: budgetData.name,
			amount: budgetData.amount,
			period: budgetData.period,
			autoRepeat: budgetData.autoRepeat === 'Yes',
			description: budgetData.description,
			categoryId: budgetData.categoryId,
			season: budgetData.season || '2024-25',
			createdBy: user.id,
			updatedBy: 1, // TODO: Map to actual user ID
		};

		const { data, error } = await (supabase as any)
			.from('budgets')
			.insert(cleanBudgetData)
			.select()
			.single();

		if (error) throw error;
		return data;
	}

	async updateBudget(id: number, budgetData: any) {
		// Temporarily bypass authentication for debugging
		// const user = await this.getCachedUser();
		// if (!user) throw new Error('Not authenticated');

		const cleanBudgetData = {
			name: budgetData.name,
			amount: budgetData.amount,
			period: budgetData.period,
			autoRepeat: budgetData.autoRepeat !== undefined ? budgetData.autoRepeat : false,
			description: budgetData.description || null,
			categoryId: budgetData.categoryId || null,
			season: budgetData.season,
			updatedBy: budgetData.updatedBy || 1, // Use provided updatedBy or default to 1
			is_pinned: budgetData.is_pinned !== undefined ? budgetData.is_pinned : false,
		};

		console.log('SupabaseAPI updateBudget - Clean data:', cleanBudgetData);

		const { data, error } = await (supabase as any)
			.from('budgets')
			.update(cleanBudgetData)
			.eq('id', id)
			.select()
			.single();

		if (error) {
			console.error('SupabaseAPI updateBudget - Database error:', error);
			throw error;
		}
		
		console.log('SupabaseAPI updateBudget - Success:', data);
		return data;
	}

	async deleteBudget(id: number) {
		const user = await this.getCachedUser();
		if (!user) throw new Error('Not authenticated');

		const { error } = await (supabase as any)
			.from('budgets')
			.delete()
			.eq('id', id);

		if (error) throw error;
		return { success: true };
	}

	// Expenses
	async getExpenses(params?: any) {
		let query = (supabase as any)
			.from('expenses')
			.select(`
				*,
				event:events(id, name),
				budget:budgets(id, name)
			`)
			.order('date', { ascending: false });

		if (params?.budgetId) {
			query = query.eq('budgetId', params.budgetId);
		}

		const { data, error } = await query;
		if (error) throw error;
		return data;
	}

	async getExpense(id: number) {
		const { data, error } = await (supabase as any)
			.from('expenses')
			.select(`
				*,
				event:events(id, name),
				budget:budgets(id, name)
			`)
			.eq('id', id)
			.single();

		if (error) throw error;
		return data;
	}

	async createExpense(expenseData: any) {
		const user = await this.getCachedUser();
		if (!user) throw new Error('Not authenticated');

		const cleanExpenseData = {
			budgetId: expenseData.budgetId,
			merchant: expenseData.merchant,
			amount: expenseData.amount,
			category: expenseData.category,
			date: expenseData.date,
			eventId: expenseData.eventId,
			description: expenseData.description,
			receiptUrl: expenseData.receiptUrl,
			createdBy: user.id,
			updatedBy: 1, // TODO: Map to actual user ID
		};

		const { data, error } = await (supabase as any)
			.from('expenses')
			.insert(cleanExpenseData)
			.select()
			.single();

		if (error) throw error;
		return data;
	}

	async updateExpense(id: number, expenseData: any) {
		const user = await this.getCachedUser();
		if (!user) throw new Error('Not authenticated');

		const cleanExpenseData = {
			budgetId: expenseData.budgetId,
			merchant: expenseData.merchant,
			amount: expenseData.amount,
			category: expenseData.category,
			date: expenseData.date,
			eventId: expenseData.eventId,
			description: expenseData.description,
			receiptUrl: expenseData.receiptUrl,
			updatedBy: 1, // TODO: Map to actual user ID
		};

		const { data, error } = await (supabase as any)
			.from('expenses')
			.update(cleanExpenseData)
			.eq('id', id)
			.select()
			.single();

		if (error) throw error;
		return data;
	}

	async deleteExpense(id: number) {
		const user = await this.getCachedUser();
		if (!user) throw new Error('Not authenticated');

		const { error } = await (supabase as any)
			.from('expenses')
			.delete()
			.eq('id', id);

		if (error) throw error;
		return { success: true };
	}

	// Quick Notes Methods
	async getQuickNotes() {
		const user = await this.getCachedUser();
		if (!user) throw new Error('Not authenticated');

		const { data, error } = await (supabase as any)
			.from('quick_notes')
			.select(`
				*,
				coach_mentions(
					mentioned_user_id,
					mention_text,
					start_position,
					end_position
				)
			`)
			.eq('created_by', user.id)
			.order('created_at', { ascending: false });

		if (error) throw error;
		return data || [];
	}

	async createQuickNote(noteData: {
		content: string;
		color?: string;
		position_x?: number;
		position_y?: number;
		is_pinned?: boolean;
		mentions?: any[];
	}) {
		const user = await this.getCachedUser();
		if (!user) throw new Error('Not authenticated');

		const { data: note, error: noteError } = await (supabase as any)
			.from('quick_notes')
			.insert({
				content: noteData.content,
				color: noteData.color || '#FFE66D',
				position_x: noteData.position_x || 0,
				position_y: noteData.position_y || 0,
				is_pinned: noteData.is_pinned || false,
				created_by: user.id
			})
			.select()
			.single();

		if (noteError) throw noteError;

		// Add mentions if provided
		if (noteData.mentions && noteData.mentions.length > 0) {
			const mentionInserts = noteData.mentions.map((mention: any) => ({
				note_id: note.id,
				mentioned_user_id: mention.userId,
				mention_text: mention.text,
				start_position: mention.startPosition,
				end_position: mention.endPosition
			}));

			await (supabase as any).from('coach_mentions').insert(mentionInserts);

			// Create notifications
			const notificationInserts = noteData.mentions.map((mention: any) => ({
				user_id: mention.userId,
				note_id: note.id,
				mentioned_by: user.id
			}));

			await (supabase as any).from('mention_notifications').insert(notificationInserts);
		}

		return note;
	}

	async updateQuickNote(id: number, noteData: {
		content?: string;
		color?: string;
		position_x?: number;
		position_y?: number;
		is_pinned?: boolean;
		mentions?: any[];
	}) {
		const user = await this.getCachedUser();
		if (!user) throw new Error('Not authenticated');

		const updateData: any = {
			updated_at: new Date().toISOString()
		};

		if (noteData.content !== undefined) updateData.content = noteData.content;
		if (noteData.color !== undefined) updateData.color = noteData.color;
		if (noteData.position_x !== undefined) updateData.position_x = noteData.position_x;
		if (noteData.position_y !== undefined) updateData.position_y = noteData.position_y;
		if (noteData.is_pinned !== undefined) updateData.is_pinned = noteData.is_pinned;

		const { data: note, error: noteError } = await (supabase as any)
			.from('quick_notes')
			.update(updateData)
			.eq('id', id)
			.eq('created_by', user.id)
			.select()
			.single();

		if (noteError) throw noteError;

		// Update mentions if provided
		if (noteData.mentions !== undefined) {
			await (supabase as any).from('coach_mentions').delete().eq('note_id', id);
			
			if (noteData.mentions.length > 0) {
				const mentionInserts = noteData.mentions.map((mention: any) => ({
					note_id: id,
					mentioned_user_id: mention.userId,
					mention_text: mention.text,
					start_position: mention.startPosition,
					end_position: mention.endPosition
				}));
				await (supabase as any).from('coach_mentions').insert(mentionInserts);

				// Create notifications
				const notificationInserts = noteData.mentions.map((mention: any) => ({
					user_id: mention.userId,
					note_id: id,
					mentioned_by: user.id
				}));
				await (supabase as any).from('mention_notifications').insert(notificationInserts);
			}
		}

		return note;
	}

	async deleteQuickNote(id: number) {
		const user = await this.getCachedUser();
		if (!user) throw new Error('Not authenticated');

		const { error } = await (supabase as any)
			.from('quick_notes')
			.delete()
			.eq('id', id)
			.eq('created_by', user.id);

		if (error) throw error;
		return { success: true };
	}


	// Coach Search Methods
	async searchCoaches(query: string = '') {
		const user = await this.getCachedUser();
		if (!user) throw new Error('Not authenticated');

		const { data: coaches, error } = await (supabase as any).auth.admin.listUsers({
			page: 1,
			perPage: 10
		});

		if (error) throw error;

		let filteredCoaches = coaches?.users || [];
		
		if (query) {
			filteredCoaches = filteredCoaches.filter((coach: any) => {
				const metadata = coach.user_metadata || {};
				const fullName = metadata.full_name || metadata.name || '';
				const email = coach.email || '';
				const searchTerm = query.toLowerCase();
				
				return email.toLowerCase().includes(searchTerm) || 
					   fullName.toLowerCase().includes(searchTerm);
			});
		}

		return filteredCoaches.map((coach: any) => {
			const metadata = coach.user_metadata || {};
			const fullName = metadata.full_name || metadata.name || '';
			const firstName = metadata.first_name || fullName.split(' ')[0] || '';
			const lastName = metadata.last_name || fullName.split(' ').slice(1).join(' ') || '';
			
			return {
				id: coach.id,
				email: coach.email,
				name: fullName || coach.email.split('@')[0],
				firstName,
				lastName,
				initials: (firstName[0] || '') + (lastName[0] || ''),
				username: coach.email.split('@')[0]
			};
		});
	}

	// Notifications Methods
	async getNotifications(unreadOnly: boolean = false) {
		const user = await this.getCachedUser();
		if (!user) throw new Error('Not authenticated');

		let query = (supabase as any)
			.from('mention_notifications')
			.select(`
				*,
				quick_notes(
					id,
					content,
					color,
					created_at
				),
				auth.users!mention_notifications_mentioned_by_fkey(
					id,
					email,
					raw_user_meta_data
				)
			`)
			.eq('user_id', user.id)
			.order('created_at', { ascending: false });

		if (unreadOnly) {
			query = query.eq('is_read', false);
		}

		const { data: notifications, error } = await query;

		if (error) throw error;

		return (notifications || []).map((notification: any) => {
			const mentionedBy = notification.auth?.users || {};
			const metadata = mentionedBy.raw_user_meta_data || {};
			const fullName = metadata.full_name || metadata.name || mentionedBy.email?.split('@')[0] || 'Unknown';

			return {
				id: notification.id,
				noteId: notification.note_id,
				mentionedBy: {
					id: mentionedBy.id,
					name: fullName,
					email: mentionedBy.email,
					initials: fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase()
				},
				note: notification.quick_notes,
				isRead: notification.is_read,
				createdAt: notification.created_at,
				readAt: notification.read_at
			};
		});
	}

	async markNotificationsAsRead(notificationIds: number[]) {
		const user = await this.getCachedUser();
		if (!user) throw new Error('Not authenticated');

		const { error } = await (supabase as any)
			.from('mention_notifications')
			.update({
				is_read: true,
				read_at: new Date().toISOString()
			} as any)
			.in('id', notificationIds)
			.eq('user_id', user.id);

		if (error) throw error;
		return { success: true };
	}
}

export const supabaseAPI = new SupabaseAPI()