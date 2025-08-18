import { supabase } from '@/lib/supabase'
import { Database } from '@/types/database'

type Tables = Database['public']['Tables']

export class SupabaseAPI {
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
  }) {
    let query = supabase
      .from('events')
      .select(`
        *,
        event_types (
          id,
          name,
          color,
          text_color
        )
      `)
      .order('start_time', { ascending: false })

    // Apply filters
    if (params?.name) {
      query = query.ilike('name', `%${params.name}%`)
    }
    
    if (params?.startDate && params?.endDate) {
      query = query
        .gte('start_time', params.startDate)
        .lte('start_time', params.endDate)
    }
    
    if (params?.eventTypeIds && params.eventTypeIds.length > 0) {
      query = query.in('event_type_id', params.eventTypeIds)
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

    const { data, error, count } = await query

    if (error) throw error

    return {
      data: data || [],
      meta: {
        total: count || 0,
        page: params?.page || 1,
        perPage: params?.perPage || 20
      }
    }
  }

  async getEvent(id: number) {
    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        event_types (
          id,
          name,
          color,
          text_color
        )
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  }

  async createEvent(eventData: Tables['events']['Insert']) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('events')
      .insert({
        ...eventData,
        user_id: user.id
      })
      .select(`
        *,
        event_types (
          id,
          name,
          color,
          text_color
        )
      `)
      .single()

    if (error) throw error
    return data
  }

  async updateEvent(id: number, eventData: Tables['events']['Update']) {
    const { data, error } = await supabase
      .from('events')
      .update({
        ...eventData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        event_types (
          id,
          name,
          color,
          text_color
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
    let query = supabase
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
        ),
        player_tasks (
          player_id,
          status,
          players (
            id,
            name
          )
        )
      `)
      .order('created_at', { ascending: false })

    // Apply filters
    if (params?.name) {
      query = query.ilike('name', `%${params.name}%`)
    }
    
    if (params?.eventId) {
      query = query.eq('event_id', params.eventId)
    }
    
    if (params?.status) {
      query = query.eq('status', params.status)
    }
    
    if (params?.priorityId) {
      query = query.eq('priority_id', params.priorityId)
    }
    
    if (params?.dueDate) {
      query = query.eq('due_date', params.dueDate)
    }

    // Apply pagination
    if (params?.page && params?.perPage) {
      const from = (params.page - 1) * params.perPage
      const to = from + params.perPage - 1
      query = query.range(from, to)
    }

    const { data, error, count } = await query

    if (error) throw error

    return {
      data: data || [],
      meta: {
        total: count || 0,
        page: params?.page || 1,
        perPage: params?.perPage || 20
      }
    }
  }

  async createTask(taskData: Tables['tasks']['Insert'] & { playerIds?: number[] }) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { playerIds, ...taskFields } = taskData

    // Create the task
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .insert({
        ...taskFields,
        user_id: user.id
      })
      .select()
      .single()

    if (taskError) throw taskError

    // Create player task assignments if provided
    if (playerIds && playerIds.length > 0) {
      const playerTasks = playerIds.map(playerId => ({
        task_id: task.id,
        player_id: playerId
      }))

      const { error: playerTaskError } = await supabase
        .from('player_tasks')
        .insert(playerTasks)

      if (playerTaskError) throw playerTaskError
    }

    // Return the complete task with relations
    return this.getTaskById(task.id)
  }

  async updateTask(id: number, taskData: Tables['tasks']['Update'] & { playerIds?: number[] }) {
    const { playerIds, ...taskFields } = taskData

    // Update the task
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .update({
        ...taskFields,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (taskError) throw taskError

    // Update player assignments if provided
    if (playerIds !== undefined) {
      // Remove existing assignments
      await supabase
        .from('player_tasks')
        .delete()
        .eq('task_id', id)

      // Add new assignments
      if (playerIds.length > 0) {
        const playerTasks = playerIds.map(playerId => ({
          task_id: id,
          player_id: playerId
        }))

        const { error: playerTaskError } = await supabase
          .from('player_tasks')
          .insert(playerTasks)

        if (playerTaskError) throw playerTaskError
      }
    }

    return this.getTaskById(id)
  }

  async getTaskById(id: number) {
    const { data, error } = await supabase
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
        ),
        player_tasks (
          player_id,
          status,
          players (
            id,
            name
          )
        )
      `)
      .eq('id', id)
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
  }) {
    let query = supabase
      .from('players')
      .select(`
        *,
        positions (
          id,
          name,
          abbreviation
        )
      `)
      .eq('is_active', true)
      .order('name', { ascending: true })

    if (params?.name) {
      query = query.ilike('name', `%${params.name}%`)
    }
    
    if (params?.positionIds && params.positionIds.length > 0) {
      query = query.in('position_id', params.positionIds)
    }

    if (params?.page && params?.perPage) {
      const from = (params.page - 1) * params.perPage
      const to = from + params.perPage - 1
      query = query.range(from, to)
    }

    const { data, error, count } = await query

    if (error) throw error

    return {
      data: data || [],
      meta: {
        total: count || 0,
        page: params?.page || 1,
        perPage: params?.perPage || 20
      }
    }
  }

  async getPlayer(id: number) {
    const { data, error } = await supabase
      .from('players')
      .select(`
        *,
        positions (
          id,
          name,
          abbreviation
        )
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  }

  async createPlayer(playerData: Tables['players']['Insert']) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('players')
      .insert({
        ...playerData,
        user_id: user.id
      })
      .select(`
        *,
        positions (
          id,
          name,
          abbreviation
        )
      `)
      .single()

    if (error) throw error
    return data
  }

  // Metadata
  async getEventTypes() {
    const { data, error } = await supabase
      .from('event_types')
      .select('*')
      .order('name', { ascending: true })

    if (error) throw error
    return data || []
  }

  async getPositions() {
    const { data, error } = await supabase
      .from('positions')
      .select('*')
      .order('name', { ascending: true })

    if (error) throw error
    return data || []
  }

  async getPriorities() {
    const { data, error } = await supabase
      .from('task_priorities')
      .select('*')
      .order('weight', { ascending: true })

    if (error) throw error
    return data || []
  }

  // Profile
  async getProfile() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error) throw error
    return data
  }

  async updateProfile(profileData: Tables['profiles']['Update']) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...profileData,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)
      .select()
      .single()

    if (error) throw error
    return data
  }
}

export const supabaseAPI = new SupabaseAPI()