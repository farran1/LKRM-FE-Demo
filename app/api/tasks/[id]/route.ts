import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClientWithAuth } from '@/lib/supabase'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: taskId } = await params
    
    console.log(`Fetching task ${taskId}`)

    // Fetch the task using the correct primary key 'userId'
    const { data: task, error } = await supabase
      .from('tasks')
      .select(`
        *,
        task_priorities(name, weight, color),
        events(name)
      `)
      .eq('userId', parseInt(taskId)) // Using 'userId' as primary key per actual schema
      .single()

    if (error) {
      console.error('Error fetching task:', error)
      return NextResponse.json(
        { error: 'Failed to fetch task', details: error.message },
        { status: 500 }
      )
    }

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    // Transform the task data to match frontend expectations
    let assigneeDisplayName = 'Unassigned'
    let assigneeEmail = null
    
    if (task.assigneeId) {
      try {
        const { data: userData, error: userError } = await supabase
          .from('auth.users')
          .select('email, user_metadata')
          .eq('email', task.assigneeId)
          .single()
        
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
      } catch (error) {
        console.error('Error fetching assignee info:', error)
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

    console.log(`Task ${taskId} fetched successfully:`, transformedTask)
    return NextResponse.json({ data: { task: transformedTask } }, { status: 200 })

  } catch (error) {
    console.error('Error in GET /tasks/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: taskId } = await params
    const body = await request.json()
    
    console.log(`Updating task ${taskId} with payload:`, JSON.stringify(body, null, 2))

    const { status, name, description, dueDate, priorityId, eventId, assigneeId } = body

    // Validate required fields
    if (!taskId) {
      return NextResponse.json(
        { error: 'Task ID is required' },
        { status: 400 }
      )
    }

    // Get authenticated user
    const { client: supabaseAuth, user } = await createServerClientWithAuth(request)
    
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
    
    // Store user info as JSON string for updatedBy
    const userData = JSON.stringify({
      email: userEmail,
      name: userName,
      id: user.id
    })
    
    console.log('Using authenticated user for task update:', userEmail, user.id)

    // Prepare update data matching the exact Supabase schema
    const updateData: any = {
      updatedBy: userData,
      updatedAt: new Date().toISOString()
    }

    // Only update fields that are provided, using correct column names
    if (status !== undefined) updateData.status = status
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (dueDate !== undefined) updateData.dueDate = dueDate
    if (priorityId !== undefined) updateData.priorityId = priorityId
    if (eventId !== undefined) updateData.eventId = eventId
    if (assigneeId !== undefined) updateData.assigneeId = assigneeId

    console.log('Update data being sent to Supabase:', updateData)

    // Update the task using the correct primary key 'userId'
    const { data: updatedTask, error: updateError } = await supabase
      .from('tasks')
      .update(updateData)
      .eq('userId', parseInt(taskId)) // Using 'userId' as primary key per actual schema
      .select()
      .single()

    if (updateError) {
      console.error('Error updating task:', updateError)
      return NextResponse.json(
        { error: 'Failed to update task', details: updateError.message },
        { status: 500 }
      )
    }

    // Fetch the complete updated task with relationships
    const { data: completeTask, error: fetchError } = await supabase
      .from('tasks')
      .select(`
        *,
        task_priorities(name, weight, color),
        events(name, startTime, endTime)
      `)
      .eq('userId', parseInt(taskId)) // Using 'userId' as primary key per actual schema
      .single()

    if (fetchError) {
      console.error('Error fetching complete updated task:', fetchError)
      // Return the basic updated task if we can't fetch the complete one
      let assigneeDisplayName = 'Unassigned'
      let assigneeEmail = null
      
      if (updatedTask.assigneeId) {
        try {
          const { data: userData, error: userError } = await supabase
            .from('auth.users')
            .select('email, user_metadata')
            .eq('email', updatedTask.assigneeId)
            .single()
          
          if (!userError && userData) {
            assigneeEmail = userData.email
            const userName = userData.user_metadata?.first_name && userData.user_metadata?.last_name 
              ? `${userData.user_metadata.first_name} ${userData.user_metadata.last_name}`
              : userData.user_metadata?.full_name || userData.email?.split('@')[0] || 'Unknown'
            assigneeDisplayName = userName
          } else {
            assigneeDisplayName = updatedTask.assigneeId
            assigneeEmail = updatedTask.assigneeId
          }
        } catch (error) {
          console.error('Error fetching assignee info in fallback:', error)
          assigneeDisplayName = updatedTask.assigneeId
          assigneeEmail = updatedTask.assigneeId
        }
      }
      
      const transformedUpdatedTask = {
        ...updatedTask,
        id: updatedTask.userId, // Map userId to id for frontend compatibility
        // Create a users object for UI compatibility
        users: updatedTask.assigneeId ? {
          username: assigneeDisplayName,
          email: assigneeEmail
        } : null,
      }
      return NextResponse.json({ data: { task: transformedUpdatedTask } }, { status: 200 })
    }

    // Transform the complete task data to match frontend expectations
    let assigneeDisplayName = 'Unassigned'
    let assigneeEmail = null
    
    if (completeTask.assigneeId) {
      try {
        const { data: userData, error: userError } = await supabase
          .from('auth.users')
          .select('email, user_metadata')
          .eq('email', completeTask.assigneeId)
          .single()
        
        if (!userError && userData) {
          assigneeEmail = userData.email
          const userName = userData.user_metadata?.first_name && userData.user_metadata?.last_name 
            ? `${userData.user_metadata.first_name} ${userData.user_metadata.last_name}`
            : userData.user_metadata?.full_name || userData.email?.split('@')[0] || 'Unknown'
          assigneeDisplayName = userName
        } else {
          assigneeDisplayName = completeTask.assigneeId
          assigneeEmail = completeTask.assigneeId
        }
      } catch (error) {
        console.error('Error fetching assignee info in main case:', error)
        assigneeDisplayName = completeTask.assigneeId
        assigneeEmail = completeTask.assigneeId
      }
    }
    
    const transformedCompleteTask = {
      ...completeTask,
      id: completeTask.userId, // Map userId to id for frontend compatibility
      // Create a users object for UI compatibility
      users: completeTask.assigneeId ? {
        username: assigneeDisplayName,
        email: assigneeEmail
      } : null,
    }

    console.log(`Task ${taskId} updated successfully:`, transformedCompleteTask)
    // Create notification if assignee changed or set
    try {
      if (assigneeId) {
        let assigneeUuid: string | null = null
        const { data: byId } = await supabase
          .from('auth.users')
          .select('id, email')
          .eq('id', assigneeId)
          .limit(1)
        if (byId && byId.length > 0) assigneeUuid = (byId[0] as any).id
        if (!assigneeUuid) {
          const { data: byEmail } = await supabase
            .from('auth.users')
            .select('id, email')
            .eq('email', assigneeId)
            .limit(1)
          if (byEmail && byEmail.length > 0) assigneeUuid = (byEmail[0] as any).id
          if (!assigneeUuid) {
            // Try matching on email prefix
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
      }
    } catch (err) {
      console.error('Failed to create assignment notification on update:', err)
    }

    return NextResponse.json({ data: { task: transformedCompleteTask } }, { status: 200 })

  } catch (error) {
    console.error('Error in PATCH /tasks/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
