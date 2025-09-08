import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Force Node.js runtime to avoid Edge Runtime issues with Supabase
export const runtime = 'nodejs'

export async function GET() {
  try {
    const { data, error } = await (supabase as any)
      .from('budget_categories')
      .select('*')
      .order('name')

    if (error) {
      console.error('Error fetching budget categories:', error)
      return NextResponse.json(
        { error: 'Failed to fetch budget categories' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: data
    })

  } catch (error) {
    console.error('Error in budget categories API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields
    if (!body.name) {
      return NextResponse.json(
        { error: 'Category name is required' },
        { status: 400 }
      )
    }

    // Insert new category
    const { data, error } = await (supabase as any)
      .from('budget_categories')
      .insert([{
        name: body.name,
        description: body.description,
        color: body.color || '#1890ff',
        createdBy: body.createdBy || 0,
        updatedBy: body.updatedBy || 0
      }])
      .select()

    if (error) {
      console.error('Error creating budget category:', error)
      return NextResponse.json(
        { error: 'Failed to create budget category' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: data[0]
    })

  } catch (error) {
    console.error('Error in budget category creation:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
