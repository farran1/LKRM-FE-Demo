import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    
    // Create a Supabase client with the JWT token
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    })
    
    // Verify the user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''

    // Search for users from the public.users table
    let usersQuery = supabase
      .from('users')
      .select('id, email, first_name, last_name, full_name, avatar_url')
      .order('email')

    if (query) {
      // Filter by search query
      usersQuery = usersQuery.or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,full_name.ilike.%${query}%,email.ilike.%${query}%`)
    }

    const { data: users, error } = await usersQuery

    if (error) {
      console.error('Error searching users:', error)
      return NextResponse.json({ coaches: [] })
    }

    // Transform the data to match our expected format
    const transformedCoaches = (users || []).map((user: any) => {
      const firstName = user.first_name || ''
      const lastName = user.last_name || ''
      const fullName = user.full_name || `${firstName} ${lastName}`.trim() || user.email.split('@')[0]
      const username = user.email.split('@')[0]
      
      return {
        id: user.id,
        email: user.email,
        name: fullName,
        firstName: firstName,
        lastName: lastName,
        initials: fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2),
        username: username,
        avatarUrl: user.avatar_url
      }
    })

    return NextResponse.json({ coaches: transformedCoaches })
  } catch (error) {
    console.error('Error in GET /api/coaches/search:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
