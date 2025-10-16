import { NextRequest, NextResponse } from 'next/server'
import { supabase, createServerClient } from '@/lib/supabase'
import { createServerClientWithAuth } from '@/lib/supabase'

// Force Node.js runtime to avoid Edge Runtime issues with Supabase
export const runtime = 'nodejs'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { data: expense, error } = await (supabase as any)
      .from('expenses')
      .select(`
        *,
        budgets (name),
        events (name)
      `)
      .eq('id', (await params).id)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
      }
      console.error('Supabase error:', error)
      return NextResponse.json({ error: 'Failed to fetch expense' }, { status: 500 })
    }

    // Fetch user information for createdBy and updatedBy from auth.users
    let createdByUser = null
    let updatedByUser = null

    // Fetch createdBy user details - handle JSON (new), email (legacy), and integer (legacy) formats
    if (expense.createdBy) {
      try {
        // Check if it's a JSON string (new format)
        if (typeof expense.createdBy === 'string' && expense.createdBy.startsWith('{')) {
          try {
            const userData = JSON.parse(expense.createdBy)
            createdByUser = {
              id: userData.id,
              email: userData.email,
              username: userData.name || userData.email?.split('@')[0] || 'Unknown'
            }
          } catch (parseError) {
            console.log('Could not parse createdBy JSON:', parseError)
          }
        }
        // Check if it's an email (legacy format)
        else if (typeof expense.createdBy === 'string' && expense.createdBy.includes('@')) {
          // For email format, just use the email as the username
          createdByUser = {
            id: expense.createdBy,
            email: expense.createdBy,
            username: expense.createdBy.split('@')[0] || 'Unknown'
          }
        }
        // Legacy format: public users table being phased out, use placeholder
        else {
          createdByUser = {
            id: expense.createdBy,
            email: 'legacy@user.com',
            username: 'Legacy User'
          }
        }
      } catch (error) {
        console.log('Could not fetch createdBy user:', error)
      }
    }

    // Fetch updatedBy user details - handle JSON, email, and integer formats
    if (expense.updatedBy && expense.updatedBy !== 0) {
      try {
        // Check if it's JSON format (new)
        if (typeof expense.updatedBy === 'string' && expense.updatedBy.startsWith('{')) {
          try {
            const userData = JSON.parse(expense.updatedBy)
            updatedByUser = {
              id: userData.id,
              email: userData.email,
              username: userData.name || userData.email?.split('@')[0] || 'Unknown'
            }
          } catch (parseError) {
            console.log('Could not parse updatedBy JSON:', parseError)
          }
        }
        // Check if it's an email (legacy format)
        else if (typeof expense.updatedBy === 'string' && expense.updatedBy.includes('@')) {
          updatedByUser = {
            id: expense.updatedBy,
            email: expense.updatedBy,
            username: expense.updatedBy.split('@')[0] || 'Unknown'
          }
        }
        // Legacy integer format: public users table being phased out, use placeholder
        else {
          updatedByUser = {
            id: expense.updatedBy,
            email: 'legacy@user.com',
            username: 'Legacy User'
          }
        }
      } catch (error) {
        console.log('Could not fetch updatedBy user:', error)
      }
    }

    // Add user information to the expense object
    const expenseWithUsers = {
      ...expense,
      createdByUser,
      updatedByUser
    }
    
    return NextResponse.json(expenseWithUsers)
  } catch (error) {
    console.error('Error fetching expense:', error)
    return NextResponse.json({ error: 'Failed to fetch expense' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('📝 PUT /api/expenses/[id] - Updating expense:', (await params).id)
    
    const body = await request.json()
    console.log('📦 Request body:', JSON.stringify(body, null, 2))
    
    // Validate required fields
    if (!body.merchant || !body.amount || !body.date) {
      return NextResponse.json({ 
        error: 'Missing required fields', 
        required: ['merchant', 'amount', 'date'],
        received: Object.keys(body)
      }, { status: 400 })
    }
    
    // Get the authenticated user
    const { client: supabaseAuth, user } = await createServerClientWithAuth(request)
    
    if (!user) {
      console.warn('API PUT /expenses/[id] - No session found, proceeding without auth for update (dev fallback)')
      // Dev fallback user info
      const fallbackUser = { id: 'anonymous', email: 'anonymous@local' }
      console.log('API PUT /expenses/[id] - Using fallback user:', fallbackUser.email, fallbackUser.id)
    } else {
      console.log('API PUT /expenses/[id] - Authenticated user:', user.email, user.id)
    }
    
    const currentUser = user || { id: 'anonymous', email: 'anonymous@local' }
    
    // Store the authenticated user information for updatedBy
    const userEmail = currentUser.email
    const userName = currentUser?.user_metadata?.first_name && currentUser?.user_metadata?.last_name 
      ? `${currentUser.user_metadata.first_name} ${currentUser.user_metadata.last_name}`
      : currentUser?.user_metadata?.full_name || (currentUser.email?.split?.('@')[0]) || 'Unknown'
    
    // Use auth.users table for tracking (public users table being phased out)
    // Store user info as JSON string for updatedBy (same approach as createdBy)
    const updatedByData = JSON.stringify({
      email: userEmail,
      name: userName,
      id: user.id
    })
    
    console.log('Using auth.users for expense update:', userEmail, user.id)

    // Prepare update data - only update what we can
    const updateData = {
      budgetId: body.budgetId || null,
      merchant: body.merchant,
      amount: body.amount,
      category: body.category || 'General', // Default category if not provided
      date: body.date,
      eventId: body.eventId || null,
      description: body.description || null,
      receiptUrl: body.receiptUrl || null,
      updatedBy: updatedByData,
      updatedAt: new Date().toISOString()
    }
    
    console.log('🔧 Update data:', JSON.stringify(updateData, null, 2))
    
    const { data: updatedExpense, error } = await (supabase as any)
      .from('expenses')
      .update(updateData)
      .eq('id', (await params).id)
      .select()
      .single()
    
    if (error) {
      console.error('❌ Supabase error:', error)
      console.error('❌ Error details:', JSON.stringify(error, null, 2))
      return NextResponse.json({ 
        error: 'Failed to update expense', 
        details: error.message,
        code: error.code 
      }, { status: 500 })
    }
    
    console.log('✅ Successfully updated expense:', updatedExpense)
    return NextResponse.json(updatedExpense)
  } catch (error) {
    console.error('💥 Error updating expense:', error)
    console.error('💥 Error stack:', (error as any).stack)
    return NextResponse.json({ 
      error: 'Failed to update expense', 
      message: (error as any).message 
    }, { status: 500 })
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
      console.error('API DELETE /expenses - Not authenticated')
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }
    
    console.log('API DELETE /expenses - Authenticated user:', user.email, user.id)
    
    // Delete the expense
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', Number(id))
    
    if (error) {
      console.error('Error deleting expense:', error)
      throw error
    }
    
    console.log('Expense deleted successfully:', id)
    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('Error deleting expense:', error)
    return NextResponse.json(
      { error: 'Failed to delete expense' },
      { status: 500 }
    )
  }
}
