import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Force Node.js runtime to avoid Edge Runtime issues with Supabase
export const runtime = 'nodejs'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const eventId = parseInt(id)

    if (isNaN(eventId)) {
      return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 })
    }

    console.log(`Fetching expenses linked to event ${eventId}`)

    // Get expenses linked to this event
    const { data: expenses, error } = await (supabase as any)
      .from('expenses')
      .select(`
        id,
        merchant,
        amount,
        date,
        description,
        receiptUrl,
        budgetId,
        createdAt,
        createdBy,
        updatedAt,
        updatedBy,
        budgets (id, name)
      `)
      .eq('eventId', eventId)
      .order('date', { ascending: false })

    if (error) {
      console.error('Error fetching linked expenses:', error)
      return NextResponse.json({ error: 'Failed to fetch linked expenses' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: expenses || []
    })

  } catch (error) {
    console.error('Error in event expenses API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
