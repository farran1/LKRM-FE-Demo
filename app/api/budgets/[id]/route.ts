import { NextRequest, NextResponse } from 'next/server'
import { fetcher } from '../../../../src/services/api'
import { createServerClientWithAuth } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const data = await fetcher(`/api/budgets/${id}`)
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching budget:', error)
    return NextResponse.json(
      { error: 'Failed to fetch budget' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    console.log('API PUT /budgets - Request body:', body)
    // Use authenticated server client to satisfy RLS
    const { client: supabaseAuth, user } = await createServerClientWithAuth(request)
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Whitelist updatable fields
    const updateData: any = {}
    if (body.name !== undefined) updateData.name = body.name
    if (body.amount !== undefined) updateData.amount = body.amount
    if (body.period !== undefined) updateData.period = body.period
    if (body.autoRepeat !== undefined) updateData.autoRepeat = body.autoRepeat
    if (body.description !== undefined) updateData.description = body.description
    if (body.categoryId !== undefined) updateData.categoryId = body.categoryId
    if (body.season !== undefined) updateData.season = body.season
    if (body.is_pinned !== undefined) updateData.is_pinned = body.is_pinned

    // Required audit fields in schema
    updateData.updatedAt = new Date().toISOString()
    updateData.updatedBy = 1

    const { data, error } = await (supabaseAuth as any)
      .from('budgets')
      .update(updateData)
      .eq('id', Number(id))
      .select()
      .single()

    if (error) {
      console.error('API PUT /budgets - Update error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('API PUT /budgets - Update result:', data)
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error updating budget:', error)
    return NextResponse.json(
      { error: 'Failed to update budget' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Get the authenticated user
    const { client: supabaseAuth, user } = await createServerClientWithAuth(request)
    
    if (!user) {
      console.error('API DELETE /budgets - Not authenticated')
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }
    console.log('API DELETE /budgets - Authenticated user:', user.email, user.id)
    
    // First, set all expenses with this budgetId to NULL (uncategorized)
    const { error: expensesError } = await (supabaseAuth as any)
      .from('expenses')
      .update({ budgetId: null })
      .eq('budgetId', Number(id))

    if (expensesError) {
      console.error('Error updating expenses:', expensesError)
      throw expensesError
    }

    // Then delete the budget
    const { error } = await (supabaseAuth as any)
      .from('budgets')
      .delete()
      .eq('id', Number(id))

    if (error) {
      console.error('Error deleting budget:', error)
      throw error
    }

    console.log('Budget deleted successfully:', id)
    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('Error deleting budget:', error)
    return NextResponse.json(
      { error: 'Failed to delete budget' },
      { status: 500 }
    )
  }
}
