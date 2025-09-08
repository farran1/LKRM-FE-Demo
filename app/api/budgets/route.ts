import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    console.log('=== BUDGETS API START ===')
    
    // Get query parameters
    const { searchParams } = new URL(request.url)
    const season = searchParams.get('season') || '2025-2026'
    const search = searchParams.get('search') || ''
    const includeArchived = searchParams.get('includeArchived') === 'true'

    console.log('Fetching budgets with params:', { season, search, includeArchived })

    // Test Supabase connection first
    const { data: testData, error: testError } = await (supabase as any)
      .from('budgets')
      .select('count')
      .limit(1)
    
    if (testError) {
      console.error('Supabase connection test failed:', testError)
      return NextResponse.json(
        { error: `Database connection failed: ${testError.message}` },
        { status: 500 }
      )
    }
    
    console.log('Supabase connection test passed')

    // Build the query for budgets
    let query = (supabase as any)
      .from('budgets')
      .select('*')
      .eq('season', season)

    // Add search filter if provided
    if (search) {
      query = query.ilike('name', `%${search}%`)
    }

    console.log('Executing query...')
    const { data: budgets, error: budgetsError } = await query

    if (budgetsError) {
      console.error('Error fetching budgets:', budgetsError)
      return NextResponse.json(
        { error: `Failed to fetch budgets: ${budgetsError.message}` },
        { status: 500 }
      )
    }

    console.log(`Found ${budgets?.length || 0} budgets`)
    console.log('=== BUDGETS API SUCCESS ===')

    // Get expenses for spending calculation
    const { data: expenses, error: expensesError } = await (supabase as any)
      .from('expenses')
      .select('budgetId, amount')
      .not('budgetId', 'is', null)

    if (expensesError) {
      console.error('Error fetching expenses:', expensesError)
      return NextResponse.json(
        { error: `Failed to fetch expenses: ${expensesError.message}` },
        { status: 500 }
      )
    }

    // Calculate spending for each budget
    const budgetSpending = (expenses || []).reduce((acc: Record<number, number>, expense: any) => {
      if (expense.budgetId) {
        const numericAmount = typeof expense.amount === 'string' ? parseFloat(expense.amount) : Number(expense.amount) || 0
        acc[expense.budgetId] = (acc[expense.budgetId] || 0) + numericAmount
      }
      return acc
    }, {})

    // Transform budgets to include spending data
    const budgetsWithSpending = (budgets || []).map((budget: any) => {
      const totalBudget = typeof budget.amount === 'string' ? parseFloat(budget.amount) : Number(budget.amount) || 0
      const spent = budgetSpending[budget.id] || 0
      const percentage = totalBudget > 0 ? Math.round((spent / totalBudget) * 100) : 0
      
      // Determine progress bar color based on spending percentage
      let barColor = '#34c759' // Green for low spending
      if (percentage >= 80) {
        barColor = '#ff3b30' // Red for high spending
      } else if (percentage >= 60) {
        barColor = '#ff9500' // Orange for medium spending
      }

      return {
        id: budget.id,
        title: budget.name,
        period: budget.period,
        totalBudget,
        spent,
        percentage,
        barColor,
        description: budget.description,
        autoRepeat: budget.autoRepeat,
        season: budget.season
      }
    })

    return NextResponse.json({
      success: true,
      data: budgetsWithSpending,
      season: season
    })

    // NOTE: end of GET handler

  } catch (error) {
    console.error('Error in budgets API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Creating budget with data:', body)
    
    // First, let's check if the budgets table exists and what columns it has
    const { data: tableInfo, error: tableError } = await (supabase as any)
      .from('budgets')
      .select('*')
      .limit(1)
    
    if (tableError) {
      console.error('Table check error:', tableError)
      return NextResponse.json(
        { error: `Table error: ${tableError.message}` },
        { status: 500 }
      )
    }
    
    console.log('Table structure check passed')
    
    // Validate required fields
    if (!body.name || !body.amount || !body.period) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const budgetData = {
      name: body.name,
      amount: body.amount,
      period: body.period,
      season: body.season || '2025-2026',
      description: body.description,
      autoRepeat: body.autoRepeat || false,
      createdBy: body.createdBy || 0,
      updatedBy: body.updatedBy || 0,
      categoryId: null // Set to null since we're not using categories for now
    }
    
    console.log('Inserting budget data:', budgetData)

    // Insert new budget
    const { data, error } = await (supabase as any)
      .from('budgets')
      .insert([budgetData])
      .select()

    if (error) {
      console.error('Supabase error creating budget:', error)
      return NextResponse.json(
        { error: `Failed to create budget: ${error.message}` },
        { status: 500 }
      )
    }

    console.log('Budget created successfully:', data)
    return NextResponse.json({
      success: true,
      data: data[0]
    })

  } catch (error) {
    console.error('Error in budget creation:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
