import { supabaseAPI } from './supabase-api'

// Use Supabase for all API calls
const api = {
  get: async (url: string) => {
    const urlObj = new URL(url, 'http://localhost')
    const path = urlObj.pathname
    const searchParams = Object.fromEntries(urlObj.searchParams.entries())

    // Convert string params to appropriate types
    const params = {
      ...searchParams,
      page: searchParams.page ? parseInt(searchParams.page) : undefined,
      perPage: searchParams.perPage ? parseInt(searchParams.perPage) : undefined,
      eventId: searchParams.eventId ? parseInt(searchParams.eventId) : undefined,
      priorityId: searchParams.priorityId ? parseInt(searchParams.priorityId) : undefined,
      eventTypeIds: searchParams.eventTypeIds ? [parseInt(searchParams.eventTypeIds)] : undefined,
    }

    try {
      if (path === '/api/events') {
        return { data: await supabaseAPI.getEvents(params) }
      } else if (path.match(/^\/api\/events\/\d+$/)) {
        const id = parseInt(path.split('/')[3])
        return { data: { event: await supabaseAPI.getEvent(id) } }
      } else if (path === '/api/tasks') {
        return { data: await supabaseAPI.getTasks(params) }
      } else if (path === '/api/players') {
        return { data: await supabaseAPI.getPlayers(params) }
      } else if (path.match(/^\/api\/players\/\d+$/)) {
        const id = parseInt(path.split('/')[3])
        return { data: { player: await supabaseAPI.getPlayer(id) } }
      } else if (path === '/api/priorities') {
        return { data: await supabaseAPI.getPriorities() }
      } else if (path === '/api/positions') {
        return { data: await supabaseAPI.getPositions() }
      } else if (path === '/api/eventTypes') {
        return { data: await supabaseAPI.getEventTypes() }
      } else if (path === '/api/me' || path === '/api/profile') {
        return { data: await supabaseAPI.getProfile() }
      } else {
        throw new Error(`API endpoint not implemented: ${path}`)
      }
    } catch (error) {
      console.error('Supabase API Error:', error)
      throw error
    }
  },

  post: async (url: string, data: any) => {
    const urlObj = new URL(url, 'http://localhost')
    const path = urlObj.pathname

    try {
      if (path === '/api/tasks') {
        return { data: { task: await supabaseAPI.createTask(data) } }
      } else if (path === '/api/events') {
        return { data: { event: await supabaseAPI.createEvent(data) } }
      } else if (path === '/api/players') {
        return { data: { player: await supabaseAPI.createPlayer(data) } }
      } else {
        throw new Error(`API endpoint not implemented: ${path}`)
      }
    } catch (error) {
      console.error('Supabase API Error:', error)
      throw error
    }
  },

  put: async (url: string, data: any) => {
    const urlObj = new URL(url, 'http://localhost')
    const path = urlObj.pathname
}

    try {
      if (path.match(/^\/api\/tasks\/\d+$/)) {
        const id = parseInt(path.split('/')[3])
        return { data: { task: await supabaseAPI.updateTask(id, data) } }
      } else if (path.match(/^\/api\/events\/\d+$/)) {
        const id = parseInt(path.split('/')[3])
        return { data: { event: await supabaseAPI.updateEvent(id, data) } }
      } else {
        throw new Error(`API endpoint not implemented: ${path}`)
      }
    } catch (error) {
      console.error('Supabase API Error:', error)
      throw error
    }
  },

  delete: async (url: string) => {
    const urlObj = new URL(url, 'http://localhost')
    const path = urlObj.pathname

    try {
      if (path.match(/^\/api\/tasks\/\d+$/)) {
        const id = parseInt(path.split('/')[3])
        const { error } = await supabase.from('tasks').delete().eq('id', id)
        if (error) throw error
        return { data: { success: true } }
      } else {
        throw new Error(`API endpoint not implemented: ${path}`)
      }
    } catch (error) {
      console.error('Supabase API Error:', error)
      throw error
    }
  }
}

export const fetcher = (url: string) => api.get(url).then((res) => res.data || [])

// Error handler for compatibility
let showErrorMessage: (error: any) => void = (error) => {
  console.error('No error handler set:', error)
}

export const setErrorHandler = (fn: (error: any) => void) => {
  showErrorMessage = fn
}

export default api