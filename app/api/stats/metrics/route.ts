import { NextRequest, NextResponse } from 'next/server';
import { createServerClientWithAuth } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { client: supabase, user } = await createServerClientWithAuth(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const isActive = searchParams.get('is_active');

    let query = (supabase as any)
      .from('stat_metrics')
      .select('*')
      .order('name', { ascending: true });

    if (category) {
      query = query.eq('category', category);
    }

    if (isActive !== null) {
      query = query.eq('is_active', isActive === 'true');
    }

    const { data: metrics, error } = await query;

    if (error) {
      console.error('Error fetching metrics:', error);
      return NextResponse.json({ error: 'Failed to fetch metrics' }, { status: 500 });
    }

    return NextResponse.json({ metrics: metrics || [] });
  } catch (error) {
    console.error('Error in metrics GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { client: supabase, user } = await createServerClientWithAuth(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, category, description, unit, calculation_type, event_types, is_active = true } = body;

    // Validate required fields
    if (!name || !category) {
      return NextResponse.json({ error: 'Name and category are required' }, { status: 400 });
    }

    // Validate category
    const validCategories = ['offense', 'defense', 'efficiency', 'special'];
    if (!validCategories.includes(category)) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
    }

    // Validate calculation type if provided
    if (calculation_type) {
      const validCalculationTypes = ['sum', 'average', 'percentage', 'ratio'];
      if (!validCalculationTypes.includes(calculation_type)) {
        return NextResponse.json({ error: 'Invalid calculation type' }, { status: 400 });
      }
    }

    const { data: metric, error } = await (supabase as any)
      .from('stat_metrics')
      .insert({
        name,
        category,
        description,
        unit,
        calculation_type,
        event_types,
        is_active,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating metric:', error);
      return NextResponse.json({ error: 'Failed to create metric' }, { status: 500 });
    }

    return NextResponse.json({ metric }, { status: 201 });
  } catch (error) {
    console.error('Error in metrics POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}