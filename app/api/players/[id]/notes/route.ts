import { NextRequest, NextResponse } from 'next/server'
import { createServerClientWithAuth } from '@/lib/supabase'

// Force Node.js runtime to avoid Edge Runtime issues with Supabase
export const runtime = 'nodejs'

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		// Use authenticated client with RLS
		const { client: supabase, user } = await createServerClientWithAuth(request);
		
		if (!user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}
		
		const resolvedParams = await params;
		const playerId = parseInt(resolvedParams.id);
		
		if (isNaN(playerId)) {
			return NextResponse.json({ error: 'Invalid player ID' }, { status: 400 });
		}

		// Get player notes
		const { data: notes, error } = await (supabase as any)
			.from('player_notes')
			.select(`
				id,
				note_text,
				note,
				created_at,
				createdAt
			`)
			.eq('playerId', playerId)
			.order('created_at', { ascending: false });

		if (error) {
			console.error('Error fetching player notes:', error);
			return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 });
		}

		return NextResponse.json({ notes: notes || [] });
	} catch (error) {
		console.error('Error in notes GET:', error);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}

export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		// Use authenticated client with RLS
		const { client: supabase, user } = await createServerClientWithAuth(request);
		
		if (!user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}
		
		const resolvedParams = await params;
		const playerId = parseInt(resolvedParams.id);
		
		if (isNaN(playerId)) {
			return NextResponse.json({ error: 'Invalid player ID' }, { status: 400 });
		}

		const body = await request.json();
		const { content } = body;

		if (!content || content.trim().length === 0) {
			return NextResponse.json({ error: 'Note content is required' }, { status: 400 });
		}

		// Create new note
		// Note: createdBy is an integer field (legacy), set to 0 as fallback
		const { data: note, error } = await (supabase as any)
			.from('player_notes')
			.insert({
				playerId: playerId,
				note: content.trim(),
				note_text: content.trim(),
				createdBy: 0  // Legacy integer field, no mapping to auth.users
			})
			.select(`
				id,
				note_text,
				note,
				created_at,
				createdAt
			`)
			.single();

		if (error) {
			console.error('Error creating note:', error);
			return NextResponse.json({ error: 'Failed to create note' }, { status: 500 });
		}

		return NextResponse.json({ note }, { status: 201 });
	} catch (error) {
		console.error('Error in notes POST:', error);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}