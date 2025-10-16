import { NextRequest, NextResponse } from 'next/server'
import { createServerClientWithAuth } from '@/lib/supabase'
import { getUserDisplayName } from '@/utils/user-helpers'

export async function GET(request: NextRequest) {
  try {
    const { client: supabaseAuth, user } = await createServerClientWithAuth(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const userEmail = user.email
    const userName = getUserDisplayName(user)

    return NextResponse.json({ 
      user: {
        id: user.id,
        email: userEmail,
        name: userName,
        metadata: user.user_metadata
      }
    }, { status: 200 })

  } catch (error) {
    console.error('Error in GET /api/auth/user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
