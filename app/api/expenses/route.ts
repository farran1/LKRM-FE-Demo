import { NextRequest, NextResponse } from 'next/server'
import { createServerClientWithAuth } from '@/lib/supabase'

// Force Node.js runtime to avoid Edge Runtime issues with Supabase
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const { client: supabase, user } = await createServerClientWithAuth(request)
    
    const { searchParams } = new URL(request.url)
    const budgetId = searchParams.get('budgetId')
    const eventId = searchParams.get('eventId')
    const description = searchParams.get('description')
    const merchant = searchParams.get('merchant')

    console.log('Expenses API - Search params:', { description, merchant, budgetId, eventId })

    let query = (supabase as any).from('expenses').select(`
      id,
      merchant,
      amount,
      date,
      description,
      receiptUrl,
      budgetId,
      eventId,
      createdAt,
      createdBy,
      updatedAt,
      updatedBy,
      budgets (id, name),
      events (id, name)
    `)

    if (budgetId) {
      query = query.eq('budgetId', Number(budgetId))
    }

    if (eventId) {
      query = query.eq('eventId', Number(eventId))
    }

    // Add search filters - use OR logic for description and merchant
    if (description && merchant && description === merchant) {
      // Use OR query when both parameters are the same
      query = query.or(`description.ilike.%${description}%,merchant.ilike.%${description}%`)
    } else {
      // Apply individual filters
      if (description) {
        query = query.ilike('description', `%${description}%`)
      }
      if (merchant) {
        query = query.ilike('merchant', `%${merchant}%`)
      }
    }

    // Order newest first
    console.log('Expenses API - Executing query with filters applied')
    const { data, error } = await query.order('date', { ascending: false })

    if (error) {
      console.error('Error fetching expenses:', error)
      return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 })
    }

    console.log('Expenses API - Query results:', { count: data?.length, hasData: !!data })

    // Fetch user information for all expenses from auth.users
    const expensesWithUsers = await Promise.all(
      (data as any[]).map(async (expense: any) => {
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

        return {
          ...expense,
          createdByUser,
          updatedByUser
        }
      })
    )

    return NextResponse.json({ success: true, data: expensesWithUsers })
  } catch (error) {
    console.error('Expenses GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('📝 POST /api/expenses - Creating new expense...')
    
    const body = await request.json()
    console.log('📦 Request body:', JSON.stringify(body, null, 2))
    
    // Get the authenticated user
    const { client: supabaseAuth, user: authUser } = await createServerClientWithAuth(request)
    
    if (!authUser) {
      console.error('API POST /expenses - Not authenticated')
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }
    console.log('API POST /expenses - Authenticated user:', authUser.email, authUser.id)
    
    // Validate required fields
    if (!body.merchant || !body.amount || !body.date) {
      return NextResponse.json({ 
        error: 'Missing required fields', 
        required: ['merchant', 'amount', 'date'],
        received: Object.keys(body)
      }, { status: 400 })
    }

    // Store user information directly in the expense data
    const userEmail = authUser.email
    const userName = authUser.user_metadata?.first_name && authUser.user_metadata?.last_name 
      ? `${authUser.user_metadata.first_name} ${authUser.user_metadata.last_name}`
      : authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'Unknown'
    
    // Use auth.users table for tracking (public users table being phased out)
    // Store user info as JSON string for updatedBy (same approach as createdBy)
    const updatedByData = JSON.stringify({
      email: userEmail,
      name: userName,
      id: authUser.id
    })
    
    console.log('Using auth.users for expense creation:', userEmail, authUser.id)

    // Prepare the expense data - match exact database schema
    const expenseData = {
      budgetId: body.budgetId || null,
      merchant: body.merchant,
      amount: body.amount, // Keep as string, let database handle conversion
      category: body.category || 'General', // Default category if not provided
      date: body.date,
      eventId: body.eventId || null,
      description: body.description || null,
      receiptUrl: body.receiptUrl || null,
      createdBy: JSON.stringify({
        email: userEmail,
        name: userName,
        id: authUser.id
      }),
      updatedBy: updatedByData
    }
    
    console.log('🔧 Prepared expense data:', JSON.stringify(expenseData, null, 2))
    
    const { data: newExpense, error } = await (supabaseAuth as any)
      .from('expenses')
      .insert([expenseData])
      .select()
      .single()
    
    if (error) {
      console.error('❌ Supabase error:', error)
      console.error('❌ Error details:', JSON.stringify(error, null, 2))
      return NextResponse.json({ 
        error: 'Failed to create expense', 
        details: error.message,
        code: error.code 
      }, { status: 500 })
    }
    
    console.log('✅ Successfully created expense:', newExpense)
    return NextResponse.json(newExpense, { status: 201 })
  } catch (error) {
    const err: any = error
    console.error('💥 Error creating expense:', err)
    console.error('💥 Error stack:', err?.stack)
    return NextResponse.json({
      error: 'Failed to create expense',
      message: err?.message
    }, { status: 500 })
  }
}
