import { NextRequest, NextResponse } from 'next/server';
import { createServerClientWithAuth } from '@/lib/supabase';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { client: supabase, user } = await createServerClientWithAuth(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const metricId = parseInt(id);
    
    if (isNaN(metricId)) {
      return NextResponse.json({ error: 'Invalid metric ID' }, { status: 400 });
    }

    const body = await request.json();
    const { name, category, description, unit, calculation_type, event_types, is_active } = body;

    // Validate category if provided
    if (category) {
      const validCategories = ['offense', 'defense', 'efficiency', 'special'];
      if (!validCategories.includes(category)) {
        return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
      }
    }

    // Validate calculation type if provided
    if (calculation_type) {
      const validCalculationTypes = ['sum', 'average', 'percentage', 'ratio'];
      if (!validCalculationTypes.includes(calculation_type)) {
        return NextResponse.json({ error: 'Invalid calculation type' }, { status: 400 });
      }
    }

    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (name !== undefined) updateData.name = name;
    if (category !== undefined) updateData.category = category;
    if (description !== undefined) updateData.description = description;
    if (unit !== undefined) updateData.unit = unit;
    if (calculation_type !== undefined) updateData.calculation_type = calculation_type;
    if (event_types !== undefined) updateData.event_types = event_types;
    if (is_active !== undefined) updateData.is_active = is_active;

    const { data: metric, error } = await supabase
      .from('stat_metrics')
      .update(updateData)
      .eq('id', metricId)
      .select()
      .single();

    if (error) {
      console.error('Error updating metric:', error);
      return NextResponse.json({ error: 'Failed to update metric' }, { status: 500 });
    }

    if (!metric) {
      return NextResponse.json({ error: 'Metric not found' }, { status: 404 });
    }

    return NextResponse.json({ metric });
  } catch (error) {
    console.error('Error in metrics PUT:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { client: supabase, user } = await createServerClientWithAuth(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const metricId = parseInt(id);
    
    if (isNaN(metricId)) {
      return NextResponse.json({ error: 'Invalid metric ID' }, { status: 400 });
    }

    // Soft delete by setting is_active to false
    const { data: metric, error } = await supabase
      .from('stat_metrics')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', metricId)
      .select()
      .single();

    if (error) {
      console.error('Error deactivating metric:', error);
      return NextResponse.json({ error: 'Failed to deactivate metric' }, { status: 500 });
    }

    if (!metric) {
      return NextResponse.json({ error: 'Metric not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Metric deactivated successfully' });
  } catch (error) {
    console.error('Error in metrics DELETE:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
