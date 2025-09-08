import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
// Prefer service role key, but fall back to anon for read endpoints if missing
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const priorityId = searchParams.get('priorityId')
    const upcoming = searchParams.get('upcoming') === 'true'
    const perPage = searchParams.get('perPage') || '50'

    // Build the query - get ALL team tasks
    let query = supabase
      .from('tasks')
      .select(`
        *,
        task_priorities(name, weight, color),
        events(name, startTime, endTime)
      `)

    // Date filtering
    if (startDate && endDate) {
      query = query
        .gte('dueDate', startDate)
        .lte('dueDate', endDate)
    } else if (upcoming || (!startDate && !endDate)) {
      // Default to upcoming tasks: due today or in the future
      const today = new Date().toISOString().slice(0, 10)
      query = query.gte('dueDate', today)
    }

    // Add priority filtering if provided
    if (priorityId) {
      query = query.eq('priorityId', priorityId)
    }

    // Ordering and limit: upcoming by dueDate asc, otherwise createdAt desc
    if (upcoming || (!startDate && !endDate)) {
      query = query.order('dueDate', { ascending: true })
    } else {
      query = query.order('createdAt', { ascending: false })
    }
    query = query.limit(parseInt(perPage))

    const { data: tasks, error } = await query

    if (error) {
      console.error('Error fetching tasks:', error)
      return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 })
    }

    // Transform the data to match frontend expectations
    const transformedTasks = tasks?.map(task => ({
      ...task,
      id: task.userId, // Map userId to id for frontend compatibility
      // Keep assigneeId for display purposes
      assignee: task.assigneeId || 'Unassigned',
      // Create a users object for UI compatibility
      users: task.assigneeId ? {
        username: task.assigneeId,
        email: task.assigneeId
      } : null,
    })) || []

    return NextResponse.json({ 
      tasks: transformedTasks,
      meta: {
        total: transformedTasks.length,
        page: 1,
        perPage: parseInt(perPage)
      }
    })
  } catch (error) {
    console.error('Error in GET /tasks:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
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

    // Get authenticated user from session
    const res = NextResponse.next()
    const supabaseAuth = createMiddlewareClient({ req: request, res })
    const { data: { session }, error: sessionError } = await supabaseAuth.auth.getSession()
    
    if (sessionError || !session?.user) {
      console.error('Task creation - Session error:', sessionError)
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const user = session.user
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

    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .insert(taskData)
      .select(`
        *,
        task_priorities(name, weight, color),
        events(name, startTime, endTime)
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
        // Try resolve to auth.users.id using service key client (this supabase client is service or anon depending on env)
        let assigneeUuid: string | null = null

        // First try direct UUID match
        const { data: byId, error: byIdErr } = await supabase
          .from('auth.users')
          .select('id, email')
          .eq('id', assigneeId)
          .limit(1)
        if (!byIdErr && byId && byId.length > 0) {
          assigneeUuid = (byId[0] as any).id
        }

        if (!assigneeUuid) {
          // Try email match
          const { data: byEmail } = await supabase
            .from('auth.users')
            .select('id, email')
            .eq('email', assigneeId)
            .limit(1)
          if (byEmail && byEmail.length > 0) {
            assigneeUuid = (byEmail[0] as any).id
          }
          if (!assigneeUuid) {
            // Try email prefix (username)
            const emailPrefix = String(assigneeId).split('@')[0]
            const { data: allUsers } = await supabase
              .from('auth.users')
              .select('id, email')
              .limit(1000)
            const match = (allUsers || []).find((u: any) => String(u.email || '').split('@')[0] === emailPrefix)
            if (match) assigneeUuid = match.id
          }
        }

        if (assigneeUuid) {
          await supabase
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

      const { error: playerTaskError } = await supabase
        .from('player_tasks')
        .insert(playerTaskData)

      if (playerTaskError) {
        console.error('Error creating player tasks:', playerTaskError)
        // Don't fail the entire request, just log the error
      }
    }

    // Transform the task data to match frontend expectations
    const transformedTask = {
      ...task,
      id: task.userId, // Map userId to id for frontend compatibility
      // Create a users object for UI compatibility
      users: task.assigneeId ? {
        username: task.assigneeId,
        email: task.assigneeId
      } : null,
    }

    // Return the basic task data
    return NextResponse.json({ data: { task: transformedTask } }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /tasks:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
