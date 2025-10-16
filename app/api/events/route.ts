import { NextRequest, NextResponse } from 'next/server'
import { createServerClientWithAuth } from '@/lib/supabase'

export async function GET(request: NextRequest) {
	try {
		const { client: supabase, user } = await createServerClientWithAuth(request)
		
		const { searchParams } = new URL(request.url)
		const params: any = Object.fromEntries(searchParams.entries())
		console.log('API GET /events - params:', params)
		
		// Convert parameters to proper types
		if (params.eventTypeIds) {
			params.eventTypeIds = String(params.eventTypeIds).split(',').map((id: string) => parseInt(id.trim())).filter((id: number) => !isNaN(id))
		}
		if (params.page) {
			params.page = parseInt(String(params.page))
		}
		if (params.perPage) {
			params.perPage = parseInt(String(params.perPage))
		}

		// Build query
		let query = supabase
			.from('events')
			.select(`
				id,
				name,
				description,
				startTime,
				endTime,
				location,
				venue,
				eventTypeId,
				oppositionTeam,
				createdAt,
				updatedAt,
				event_types (
					id,
					name,
					color,
					icon
				),
				event_coaches (
					eventId,
					coachUsername
				)
			`)

		// Apply filters
		if (params.eventTypeIds && params.eventTypeIds.length > 0) {
			query = query.in('eventTypeId', params.eventTypeIds)
		}
		if (params.startDate) {
			query = query.gte('startTime', params.startDate)
		}
		if (params.endDate) {
			query = query.lte('startTime', params.endDate)
		}
		if (params.search) {
			query = query.or(`name.ilike.%${params.search}%,description.ilike.%${params.search}%`)
		}

		// Apply sorting
		const sortBy = params.sortBy || 'startTime'
		const sortOrder = params.sortOrder || params.sortDirection || 'desc'
		const ascending = sortOrder === 'desc' ? false : true
		
		console.log('Events API - Sorting params:', { sortBy, sortOrder, ascending, receivedParams: params })
		query = query.order(sortBy, { ascending })

		// Apply pagination
		if (params.perPage) {
			const page = params.page || 1
			const offset = (page - 1) * params.perPage
			query = query.range(offset, offset + params.perPage - 1)
		}

		const { data: events, error } = await query

		if (error) {
			console.error('Error fetching events:', error)
			return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 })
		}

		console.log('API GET /events - returning:', { events: events?.length || 0 })
		return NextResponse.json({ data: events || [] })
	} catch (error) {
		console.error('Error fetching events:', error)
		
		// Check if it's an authentication error
		if (error instanceof Error && error.message.includes('Authentication')) {
			return NextResponse.json(
				{ error: 'Authentication required' },
				{ status: 401 }
			)
		}
		
		if (error instanceof Error && error.message.includes('permissions')) {
			return NextResponse.json(
				{ error: 'Insufficient permissions' },
				{ status: 403 }
			)
		}
		
		return NextResponse.json(
			{ error: 'Failed to fetch events' },
			{ status: 500 }
		)
	}
}

export async function POST(request: NextRequest) {
	try {
		const { client: supabase, user } = await createServerClientWithAuth(request)
		
		const body = await request.json()
		console.log('API POST /events - body:', body)

		const { data: event, error } = await supabase
			.from('events')
			.insert({
				name: body.title || body.name,
				description: body.description,
				startTime: body.start_time || body.startTime,
				endTime: body.end_time || body.endTime,
				location: body.location,
				venue: body.venue,
				eventTypeId: body.event_type_id || body.eventTypeId,
				createdBy: user.id,
				updatedBy: user.id
			})
			.select(`
				id,
				name,
				description,
				startTime,
				endTime,
				location,
				venue,
				eventTypeId,
				oppositionTeam,
				createdAt,
				updatedAt,
				event_types (
					id,
					name,
					color,
					icon
				)
			`)
			.single()

		if (error) {
			console.error('Error creating event:', error)
			return NextResponse.json({ error: 'Failed to create event' }, { status: 500 })
		}

		// Handle coach assignments if members are provided
		if (Array.isArray(body?.members) && body.members.length > 0) {
			const emails: string[] = body.members.filter((v: any) => typeof v === 'string' && v.trim() !== '')
			if (emails.length > 0) {
				await supabase
					.from('event_coaches')
					.insert(emails.map((email) => ({ eventId: event.id, coachUsername: email })))
			}
		}

		console.log('API POST /events - created:', event)
		return NextResponse.json({ event }, { status: 201 })
	} catch (error) {
		console.error('Error creating event:', error)
		
		// Check if it's an authentication error
		if (error instanceof Error && error.message.includes('Authentication')) {
			return NextResponse.json(
				{ error: 'Authentication required' },
				{ status: 401 }
			)
		}
		
		if (error instanceof Error && error.message.includes('permissions')) {
			return NextResponse.json(
				{ error: 'Insufficient permissions' },
				{ status: 403 }
			)
		}
		
		return NextResponse.json(
			{ error: 'Failed to create event' },
			{ status: 500 }
		)
	}
}