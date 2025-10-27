import { NextRequest, NextResponse } from 'next/server'
import { createServerClientWithAuth } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { client: supabase, user } = await createServerClientWithAuth(request)
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const priorityId = searchParams.get('priorityId')
    const eventId = searchParams.get('eventId')
    const status = searchParams.get('status')
    const name = searchParams.get('name')
    const upcoming = searchParams.get('upcoming') === 'true'
    const viewMode = searchParams.get('viewMode') || 'list'
    const sortBy = searchParams.get('sortBy')
    const sortDirection = searchParams.get('sortDirection')
    const myTasks = searchParams.get('myTasks') === 'true'
    const perPage = searchParams.get('perPage') || '50'
    const page = searchParams.get('page') || '1'
    const offset = (parseInt(page) - 1) * parseInt(perPage)
    
    // Handle assigneeIds parameter (can be multiple values)
    const assigneeIds = searchParams.getAll('assigneeIds')
    console.log('🔍 Task API - Filter parameters:', {
      startDate, endDate, priorityId, eventId, status, name, 
      assigneeIds, upcoming, viewMode, sortBy, sortDirection, myTasks
    })

    // Get current user for My Tasks filtering
    const currentUserEmail = user.email

    // Helper function to apply filters to any query
    const applyFilters = (query: any) => {
      // Add search filter if provided
      if (name) {
        query = query.ilike('name', `%${name}%`)
      }

      // Date filtering - only apply for calendar and list views, not for progress view
      if (viewMode !== 'progress') {
        if (startDate && endDate) {
          query = query
            .gte('dueDate', startDate)
            .lte('dueDate', endDate)
        } else if (upcoming) {
          // Only apply upcoming filter when explicitly requested
          const today = new Date().toISOString().slice(0, 10)
          query = query.gte('dueDate', today)
        }
      }

      // Add priority filtering if provided
      if (priorityId) {
        query = query.eq('priorityId', priorityId)
      }

      // Add event filtering if provided
      if (eventId) {
        query = query.eq('eventId', eventId)
      }

      // Add status filtering if provided
      if (status) {
        query = query.eq('status', status)
      }

      // Add assignee filtering if provided
      if (assigneeIds && assigneeIds.length > 0) {
        query = query.in('assigneeId', assigneeIds)
      }

      // Add My Tasks filtering if requested and user is authenticated
      if (myTasks && currentUserEmail) {
        query = query.eq('assigneeId', currentUserEmail)
      }

      return query
    }

    // First, get the total count for pagination
    let countQuery = (supabase as any)
      .from('tasks')
      .select('*', { count: 'exact', head: true })
    
    countQuery = applyFilters(countQuery)
    const { count: totalCount } = await countQuery

    // Build the main query with pagination
    let query = (supabase as any)
      .from('tasks')
      .select(`
        *,
        task_priorities(name, weight, color),
        events(id, name, startTime, endTime)
      `)
    
    query = applyFilters(query)

    // Ordering and pagination
    if (viewMode === 'progress') {
      // For progress view, always order by status and then by creation date
      // Ignore any custom sorting parameters for progress view
      query = query.order('status', { ascending: true }).order('createdAt', { ascending: false })
    } else if (sortBy && sortBy !== 'assigneeId') {
      // Handle custom sorting for list and calendar views (except assigneeId which needs special handling)
      const ascending = sortDirection === 'asc'
      
      if (sortBy === 'eventId') {
        query = query.order('eventId', { ascending })
      } else if (sortBy === 'event') {
        // Sort by related events.name
        query = (query as any).order('name', { ascending, foreignTable: 'events' })
      } else if (sortBy === 'priorityId') {
        query = query.order('priorityId', { ascending })
      } else if (sortBy === 'priority') {
        // Logical ordering by weight (High>Medium>Low). Place null priorities last.
        // When sortDirection is 'desc' (ascending=false), weight desc → High first.
        // When 'asc' (ascending=true), weight asc → Low first.
        query = (query as any).order('weight', { ascending, foreignTable: 'task_priorities', nullsFirst: false })
        // Secondary order by priority name for stable alphabetical within same weight.
        query = (query as any).order('name', { ascending, foreignTable: 'task_priorities', nullsFirst: false })
      } else if (sortBy === 'dueDate') {
        query = query.order('dueDate', { ascending })
      } else if (sortBy === 'name') {
        query = query.order('name', { ascending })
      } else if (sortBy === 'status') {
        query = query.order('status', { ascending })
      } else {
        // Default fallback
        query = query.order('createdAt', { ascending: false })
      }
    } else if (upcoming || (!startDate && !endDate)) {
      query = query.order('dueDate', { ascending: true })
    } else {
      query = query.order('createdAt', { ascending: false })
    }
    
    // For assigneeId sorting, we'll handle it after fetching and transforming the data
    // For other sorting, apply pagination now
    if (sortBy !== 'assigneeId') {
      query = query.range(offset, offset + parseInt(perPage) - 1)
    }

    const { data: tasks, error } = await query

    if (error) {
      console.error('Error fetching tasks:', error)
      return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 })
    }

    console.log('Raw Supabase response:', JSON.stringify(tasks, null, 2))

    // Transform the data to match frontend expectations
    const transformedTasks = await Promise.all(tasks?.map(async (task: any) => {
      console.log('Processing task:', task);
      console.log('Task task_priorities:', task.task_priorities);
      console.log('Task events:', task.events);
      
      // Get assignee display name if assigneeId exists
      let assigneeDisplayName = 'Unassigned'
      let assigneeEmail = null
      
      if (task.assigneeId) {
        console.log('Fetching assignee info for:', task.assigneeId);
        try {
          // Try to get user info from auth.users table using service role
          if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
            console.log('Using service role key for user lookup');
            // Use assigneeId as both email and display name for now
            // In a real implementation, you'd query a users table or cache user data
            const userData = { email: task.assigneeId, user_metadata: {} as any }
            const userError = null
            
            console.log('User lookup result:', { userData, userError });
            
            if (!userError && userData) {
              assigneeEmail = userData.email
              const userName = userData.user_metadata?.first_name && userData.user_metadata?.last_name 
                ? `${userData.user_metadata.first_name} ${userData.user_metadata.last_name}`
                : userData.user_metadata?.full_name || userData.email?.split('@')[0] || 'Unknown'
              assigneeDisplayName = userName
              console.log('Found user display name:', userName);
            } else {
              // Fallback to email if user not found
              assigneeDisplayName = task.assigneeId
              assigneeEmail = task.assigneeId
              console.log('User not found, using email as display name');
            }
          } else {
            // No service role key, use email as display name
            console.log('No service role key, using email as display name');
            assigneeDisplayName = task.assigneeId
            assigneeEmail = task.assigneeId
          }
        } catch (error) {
          console.error('Error fetching assignee info:', error)
          assigneeDisplayName = task.assigneeId
          assigneeEmail = task.assigneeId
        }
      }
      
      return {
        ...task,
        id: task.userId, // Map userId to id for frontend compatibility
        // Enhanced assignee information
        assignee: assigneeDisplayName,
        // Create a users object for UI compatibility
        users: task.assigneeId ? {
          username: assigneeDisplayName,
          email: assigneeEmail,
          metadata: null
        } : null,
        // Ensure description is included
        description: task.description || '',
        // Ensure priority information is properly structured
        task_priorities: task.task_priorities || null,
        // Ensure events information is properly structured
        events: task.events || null,
      };
    }) || [])

    console.log('Transformed tasks response:', JSON.stringify(transformedTasks, null, 2))

    // Handle client-side sorting fallbacks where server-side ordering can be inconsistent
    let finalTasks = transformedTasks
    if (sortBy === 'assigneeId') {
      const ascending = sortDirection === 'asc'
      finalTasks = transformedTasks.sort((a: any, b: any) => {
        const aName = a.users?.username || 'Unassigned'
        const bName = b.users?.username || 'Unassigned'
        
        if (ascending) {
          return aName.localeCompare(bName)
        } else {
          return bName.localeCompare(aName)
        }
      })
      
      // Apply pagination after sorting
      const startIndex = offset
      const endIndex = offset + parseInt(perPage)
      finalTasks = finalTasks.slice(startIndex, endIndex)
    } else if (sortBy === 'priority') {
      const ascending = sortDirection === 'asc'
      // Sort by priority weight, then by name; place nulls last
      finalTasks = transformedTasks.sort((a: any, b: any) => {
        const aWeight = a.task_priorities?.weight
        const bWeight = b.task_priorities?.weight
        if (aWeight == null && bWeight == null) {
          // fallback to name
        } else if (aWeight == null) {
          return 1
        } else if (bWeight == null) {
          return -1
        } else if (aWeight !== bWeight) {
          return ascending ? aWeight - bWeight : bWeight - aWeight
        }
        const aName = a.task_priorities?.name || ''
        const bName = b.task_priorities?.name || ''
        return ascending ? aName.localeCompare(bName) : bName.localeCompare(aName)
      })
      const startIndex = offset
      const endIndex = offset + parseInt(perPage)
      finalTasks = finalTasks.slice(startIndex, endIndex)
    } else if (sortBy === 'event') {
      const ascending = sortDirection === 'asc'
      finalTasks = transformedTasks.sort((a: any, b: any) => {
        const aName = a.events?.name || ''
        const bName = b.events?.name || ''
        return ascending ? aName.localeCompare(bName) : bName.localeCompare(aName)
      })
      const startIndex = offset
      const endIndex = offset + parseInt(perPage)
      finalTasks = finalTasks.slice(startIndex, endIndex)
    }

    const response = NextResponse.json({ 
      data: finalTasks,
      meta: {
        total: totalCount || 0,
        page: parseInt(page),
        perPage: parseInt(perPage)
      }
    })
    
    // Add cache-busting headers to prevent stale data
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    
    return response
  } catch (error) {
    console.error('Error in GET /tasks:', error)
    
    // Check if it's an authentication error
    if (error instanceof Error && error.message.includes('Authentication')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    if (error instanceof Error && error.message.includes('permissions')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }
    
    return NextResponse.json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error instanceof Error ? error.message : 'Unknown error' : undefined
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Creating task with payload:', JSON.stringify(body, null, 2))

    const {
      name,
      description,
      dueDate,
      priorityId,
      eventId,
      playerIds,
      status = 'TODO',
      assigneeId
    } = body

    // Validate required fields
    if (!name || !priorityId) {
      return NextResponse.json(
        { error: 'Task name and priority are required' },
        { status: 400 }
      )
    }

    // Convert dueDate to proper format if provided
    let dueDateFormatted = null
    if (dueDate) {
      // Handle both dayjs objects and string dates
      const dateValue = typeof dueDate === 'string' ? dueDate : dueDate.format('YYYY-MM-DD')
      dueDateFormatted = dateValue
    }

    // Get authenticated user
    const { client: supabase, user } = await createServerClientWithAuth(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

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

    // Create the task using the actual database schema
    // Note: userId is auto-generated (serial), createdAt and updatedAt have defaults
    const taskData = {
      name,
      description,
      dueDate: dueDateFormatted,
      priorityId,
      eventId: eventId || null,
      status,
      assigneeId: assigneeId || null,
      createdBy: userData,
      updatedBy: userData
    }

    console.log('Attempting to insert task with data:', JSON.stringify(taskData, null, 2))

    const { data: task, error: taskError } = await (supabase as any)
      .from('tasks')
      .insert(taskData)
      .select(`
        *,
        task_priorities(name, weight, color),
        events(id, name, startTime, endTime)
      `)
      .single()

    if (taskError) {
      console.error('Error creating task:', taskError)
      console.error('Task data attempted:', JSON.stringify(taskData, null, 2))
      return NextResponse.json(
        { error: 'Failed to create task', details: taskError.message },
        { status: 500 })
    }

    console.log('Task created successfully:', task)

    // If a coach was assigned, create an in-app notification for them
    if (assigneeId) {
      try {
        // Use assigneeId as the UUID for now
        // In a real implementation, you'd resolve email to UUID properly
        let assigneeUuid: string | null = assigneeId

        if (assigneeUuid) {
          await (supabase as any)
            .from('mention_notifications')
            .insert({
              user_id: assigneeUuid,
              note_id: null,
              mentioned_by: user.id,
              is_read: false
            })
        }
      } catch (notifyErr) {
        console.error('Failed to create assignment notification:', notifyErr)
      }
    }

    // Create player-task relationships if players are assigned
    if (playerIds && playerIds.length > 0) {
      const playerTaskData = playerIds.map((playerId: number) => ({
        taskId: task.userId, // Use the actual task userId (primary key)
        playerId: playerId,
        status: 'assigned',
        createdAt: new Date().toISOString(),
        createdBy: userData
      }))

      // TODO: Implement player_tasks table or use existing task-player relationship
      // const { error: playerTaskError } = await (supabase as any)
      //   .from('player_tasks')
      //   .insert(playerTaskData)

      // if (playerTaskError) {
      //   console.error('Error creating player tasks:', playerTaskError)
      //   // Don't fail the entire request, just log the error
      // }
    }

    // Transform the task data to match frontend expectations
    let assigneeDisplayName = 'Unassigned'
    let assigneeEmail = null
    
    if (task.assigneeId) {
      try {
        // Try to get user info from auth.users table using service role
        if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
        // Use assigneeId as both email and display name for now
        // In a real implementation, you'd query a users table or cache user data
        const userData = { email: task.assigneeId, user_metadata: {} as any }
        const userError = null
          
          if (!userError && userData) {
            assigneeEmail = userData.email
            const userName = userData.user_metadata?.first_name && userData.user_metadata?.last_name 
              ? `${userData.user_metadata.first_name} ${userData.user_metadata.last_name}`
              : userData.user_metadata?.full_name || userData.email?.split('@')[0] || 'Unknown'
            assigneeDisplayName = userName
          } else {
            assigneeDisplayName = task.assigneeId
            assigneeEmail = task.assigneeId
          }
        } else {
          assigneeDisplayName = task.assigneeId
          assigneeEmail = task.assigneeId
        }
      } catch (error) {
        console.error('Error fetching assignee info in POST:', error)
        assigneeDisplayName = task.assigneeId
        assigneeEmail = task.assigneeId
      }
    }
    
    const transformedTask = {
      ...task,
      id: task.userId, // Map userId to id for frontend compatibility
      // Create a users object for UI compatibility
      users: task.assigneeId ? {
        username: assigneeDisplayName,
        email: assigneeEmail
      } : null,
    }

    // Return the basic task data
    return NextResponse.json({ data: { task: transformedTask } }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /tasks:', error)
    
    // Check if it's an authentication error
    if (error instanceof Error && error.message.includes('Authentication')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    if (error instanceof Error && error.message.includes('permissions')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error instanceof Error ? error.message : 'Unknown error' : undefined
      },
      { status: 500 }
    )
  }
}
