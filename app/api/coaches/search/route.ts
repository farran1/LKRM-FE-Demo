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

    // Search for coaches from auth.users table directly
    let coachesQuery = supabase
      .from('auth.users')
      .select('id, email, raw_user_meta_data')
      .order('email')

    if (query) {
      // Since we can't use complex WHERE clauses on auth.users, we'll filter in the application
      coachesQuery = coachesQuery.limit(50) // Get more results to filter
    } else {
      coachesQuery = coachesQuery.limit(20) // Limit results when no query
    }

    const { data: coaches, error } = await coachesQuery

    if (error) {
      console.error('Error searching coaches from auth.users:', error)
      // Fallback: return empty array if query fails
      return NextResponse.json({ coaches: [] })
    }

    // Transform the data to match our expected format
    let transformedCoaches = (coaches || []).map((coach: any) => {
      const email = coach.email || ''
      const metadata = coach.raw_user_meta_data || {}
      // Use first_name and last_name from metadata, fallback to full_name, then email prefix
      const firstName = metadata.first_name || ''
      const lastName = metadata.last_name || ''
      const fullName = `${firstName} ${lastName}`.trim() || metadata.full_name || email.split('@')[0]
      const username = email.split('@')[0]
      
      return {
        id: coach.id,
        email: email,
        name: fullName,
        firstName: firstName,
        lastName: lastName,
        initials: fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2),
        username: username
      }
    })

    // Filter coaches based on search query if provided
    if (query) {
      const lowerQuery = query.toLowerCase()
      transformedCoaches = transformedCoaches.filter(coach => 
        coach.name.toLowerCase().includes(lowerQuery) ||
        coach.email.toLowerCase().includes(lowerQuery) ||
        coach.username.toLowerCase().includes(lowerQuery) ||
        coach.firstName.toLowerCase().includes(lowerQuery) ||
        coach.lastName.toLowerCase().includes(lowerQuery)
      )
    }

    return NextResponse.json({ coaches: transformedCoaches })
  } catch (error) {
    console.error('Error in GET /api/coaches/search:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
