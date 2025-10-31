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
				note,
				note_text,
				created_at,
				createdAt,
				updated_at,
				createdBy
			`)
			.eq('id', noteId)
			.eq('playerId', playerId)
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

		// Update note - use correct columns
		// Note: createdBy is an integer field (legacy), so we don't check ownership
		const { data: note, error } = await (supabase as any)
			.from('player_notes')
	      .update({
	        note_text: content.trim(),
	        note: content.trim(),
	        updatedAt: new Date().toISOString(),
	        updated_at: new Date().toISOString()
	      })
			.eq('id', noteId)
			.eq('playerId', playerId)
			.select(`
				id,
				note,
				note_text,
				created_at,
				createdAt,
				updated_at,
				updatedAt,
				createdBy
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

		// Delete note - use playerId for player_notes table
		// Note: createdBy is an integer field, not UUID, so we don't check ownership
		const { data: deletedNotes, error } = await (supabase as any)
			.from('player_notes')
			.delete()
			.eq('id', noteId)
			.eq('playerId', playerId)
			.select();

		if (error) {
			console.error('Error deleting note:', error);
			return NextResponse.json({ error: 'Failed to delete note', details: error.message }, { status: 500 });
		}

		// Verify deletion succeeded - check if any rows were deleted
		if (!deletedNotes || deletedNotes.length === 0) {
			return NextResponse.json({ error: 'Note not found or already deleted' }, { status: 404 });
		}

		return NextResponse.json({ message: 'Note deleted successfully' });
	} catch (error) {
		console.error('Error in note DELETE:', error);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}