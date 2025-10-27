import { NextRequest, NextResponse } from 'next/server'
import { createServerClientWithAuth } from '@/lib/supabase'

// Force Node.js runtime to avoid Edge Runtime issues with Supabase
export const runtime = 'nodejs'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; noteId: string }> }
) {
	try {
		const { client: supabase, user } = await createServerClientWithAuth(request);
		
		if (!user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}
		
        const { id, noteId: nid } = await params;
        const playerId = parseInt(id);
        const noteId = parseInt(nid);
		
		if (isNaN(playerId) || isNaN(noteId)) {
			return NextResponse.json({ error: 'Invalid player ID or note ID' }, { status: 400 });
		}

		// Get specific note
		const { data: note, error } = await (supabase as any)
			.from('player_notes')
			.select(`
				id,
				content,
				created_at,
				updated_at,
				created_by,
				auth_users!player_notes_created_by_fkey (
					id,
					email
				)
			`)
			.eq('id', noteId)
			.eq('player_id', playerId)
			.single();

		if (error) {
			console.error('Error fetching note:', error);
			return NextResponse.json({ error: 'Failed to fetch note' }, { status: 500 });
		}

		if (!note) {
			return NextResponse.json({ error: 'Note not found' }, { status: 404 });
		}

		return NextResponse.json({ note });
	} catch (error) {
		console.error('Error in note GET:', error);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; noteId: string }> }
) {
	try {
		const { client: supabase, user } = await createServerClientWithAuth(request);
		
		if (!user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}
		
        const { id, noteId: nid } = await params;
        const playerId = parseInt(id);
        const noteId = parseInt(nid);
		
		if (isNaN(playerId) || isNaN(noteId)) {
			return NextResponse.json({ error: 'Invalid player ID or note ID' }, { status: 400 });
		}

		const body = await request.json();
		const { content } = body;

		if (!content || content.trim().length === 0) {
			return NextResponse.json({ error: 'Note content is required' }, { status: 400 });
		}

		// Update note - use correct column and enforce ownership
		const { data: note, error } = await (supabase as any)
			.from('player_notes')
	      .update({
	        note_text: content.trim(),
	        updated_at: new Date().toISOString()
	      })
			.eq('id', noteId)
			.eq('player_id', playerId)
			.eq('created_by', user.id)
			.select(`
				id,
				note_text,
				created_at,
				updated_at,
				created_by,
				auth_users!player_notes_created_by_fkey (
					id,
					email
				)
			`)
			.single();

		if (error) {
			console.error('Error updating note:', error);
			return NextResponse.json({ error: 'Failed to update note' }, { status: 500 });
		}

		return NextResponse.json({ note });
	} catch (error) {
		console.error('Error in note PUT:', error);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; noteId: string }> }
) {
	try {
		const { client: supabase, user } = await createServerClientWithAuth(request);
		
		if (!user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}
		
        const { id, noteId: nid } = await params;
        const playerId = parseInt(id);
        const noteId = parseInt(nid);
		
		if (isNaN(playerId) || isNaN(noteId)) {
			return NextResponse.json({ error: 'Invalid player ID or note ID' }, { status: 400 });
		}

		// Delete note - enforce ownership to satisfy RLS
		const { error } = await (supabase as any)
			.from('player_notes')
			.delete()
			.eq('id', noteId)
			.eq('player_id', playerId)
			.eq('created_by', user.id);

		if (error) {
			console.error('Error deleting note:', error);
			return NextResponse.json({ error: 'Failed to delete note' }, { status: 500 });
		}

		return NextResponse.json({ message: 'Note deleted successfully' });
	} catch (error) {
		console.error('Error in note DELETE:', error);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}