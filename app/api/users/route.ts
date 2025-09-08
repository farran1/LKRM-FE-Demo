import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client with service role key for admin access
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseServiceKey) {
  console.error('SUPABASE_SERVICE_ROLE_KEY is required for user management')
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userIds = searchParams.get('ids')?.split(',').filter(Boolean) || []

    if (userIds.length === 0) {
      return NextResponse.json({ users: [] })
    }

    // Fetch users from auth.users
    const { data: users, error } = await supabase.auth.admin.listUsers()

    if (error) {
      console.error('Error fetching users:', error)
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }

    // Filter users by the requested IDs and format the response
    const filteredUsers = users.users
      .filter((user: any) => userIds.includes(user.id))
      .map((user: any) => ({
        id: user.id,
        email: user.email,
        name: user.user_metadata?.first_name && user.user_metadata?.last_name 
          ? `${user.user_metadata.first_name} ${user.user_metadata.last_name}`
          : user.user_metadata?.full_name || user.email?.split('@')[0] || 'Team Member',
        username: user.user_metadata?.username || user.email?.split('@')[0] || 'user'
      }))

    return NextResponse.json({ users: filteredUsers })
  } catch (error) {
    console.error('Error in GET /users:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}