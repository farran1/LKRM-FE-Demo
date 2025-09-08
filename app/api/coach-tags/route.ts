import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all coach tags
    const { data: tags, error } = await supabase
      .from('coach_tags')
      .select('*')
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching coach tags:', error)
      return NextResponse.json({ error: 'Failed to fetch tags' }, { status: 500 })
    }

    return NextResponse.json({ tags: tags || [] })
  } catch (error) {
    console.error('Error in GET /api/coach-tags:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, color, description } = body

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    // Check if tag already exists
    const { data: existingTag } = await supabase
      .from('coach_tags')
      .select('id')
      .eq('name', name)
      .single()

    if (existingTag) {
      return NextResponse.json({ error: 'Tag with this name already exists' }, { status: 409 })
    }

    // Create the coach tag
    const { data: tag, error } = await supabase
      .from('coach_tags')
      .insert({
        name,
        color: color || '#1890ff',
        description: description || '',
        created_by: user.id
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating coach tag:', error)
      return NextResponse.json({ error: 'Failed to create tag' }, { status: 500 })
    }

    return NextResponse.json({ tag }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/coach-tags:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
