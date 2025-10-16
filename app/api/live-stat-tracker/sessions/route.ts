import { NextRequest, NextResponse } from 'next/server'
import { SupabaseAPI } from '../../../../src/services/supabase-api'

const supabaseAPI = new SupabaseAPI()

export async function POST(request: NextRequest) {
  try {
    const sessionData = await request.json()
    console.log('API POST /live-stat-tracker/sessions - received:', sessionData)
    
    // For now, just return success since we're focusing on offline functionality
    // In a full implementation, this would save to the database
    return NextResponse.json({ 
      success: true, 
      id: sessionData.id || 'temp-session-id',
      message: 'Session data received (offline mode)' 
    }, { status: 201 })
    
  } catch (error) {
    console.error('Error handling session data:', error)
    return NextResponse.json(
      { error: 'Failed to process session data' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Return empty array for now since we're focusing on offline functionality
    return NextResponse.json([])
    
  } catch (error) {
    console.error('Error fetching sessions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    )
  }
}


