import { NextRequest, NextResponse } from 'next/server'
import { SupabaseAPI } from '../../../src/services/supabase-api'

const supabaseAPI = new SupabaseAPI()

export async function GET(request: NextRequest) {
  try {
    console.log('API GET /event-types - fetching event types')
    
    const eventTypes = await supabaseAPI.getEventTypes()
    console.log('API GET /event-types - result:', eventTypes)
    
    return NextResponse.json(eventTypes || [])
    
  } catch (error) {
    console.error('Error fetching event types:', error)
    return NextResponse.json(
      { error: 'Failed to fetch event types' },
      { status: 500 }
    )
  }
}
