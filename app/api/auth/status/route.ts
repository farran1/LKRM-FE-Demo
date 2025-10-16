import { NextRequest, NextResponse } from 'next/server'
import { createServerClientWithAuth } from '@/lib/supabase'
import { getUserDisplayName } from '@/utils/user-helpers'

export async function GET(request: NextRequest) {
  try {
    const { client: supabaseAuth, user } = await createServerClientWithAuth(request)
    
    if (!user) {
      return NextResponse.json({
        authenticated: false,
        error: 'No session found',
        user: null
      })
    }

    const userEmail = user.email
    const userName = getUserDisplayName(user)

    return NextResponse.json({ 
      authenticated: true,
      user: {
        id: user.id,
        email: userEmail,
        name: userName,
        metadata: user.user_metadata,
        lastSignIn: user.last_sign_in_at,
        createdAt: user.created_at
      },
      session: {
        expiresAt: null, // Not available without session
        refreshToken: 'present' // Assume present if user exists
      }
    })

  } catch (error) {
    console.error('Error in GET /api/auth/status:', error)
    return NextResponse.json({
      authenticated: false,
      error: 'Internal server error',
      user: null
    })
  }
}
