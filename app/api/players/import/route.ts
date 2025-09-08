import { NextRequest, NextResponse } from 'next/server'
import { SupabaseAPI } from '../../../../src/services/supabase-api'
type SchoolYear = 'freshman' | 'sophomore' | 'junior' | 'senior'

const supabaseAPI = new SupabaseAPI()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { importId, option } = body

    if (!importId) {
      return NextResponse.json(
        { error: 'Import ID is required' },
        { status: 400 }
      )
    }

    // Get stored import session data
    let importSession = null
    if (typeof globalThis !== 'undefined') {
      // @ts-ignore
      if (globalThis.importSessions && globalThis.importSessions.has(importId)) {
        // @ts-ignore
        importSession = globalThis.importSessions.get(importId)
      }
    }

    if (!importSession) {
      return NextResponse.json(
        { error: 'Import session not found or expired. Please upload the file again.' },
        { status: 404 }
      )
    }

    const { data: validatedPlayers } = importSession

    if (!validatedPlayers || validatedPlayers.length === 0) {
      return NextResponse.json(
        { error: 'No player data found to import' },
        { status: 400 }
      )
    }

    // Filter only valid players
    const validPlayers = validatedPlayers.filter((player: any) => player.isValid)

    if (validPlayers.length === 0) {
      return NextResponse.json(
        { error: 'No valid players to import. Please fix validation errors and try again.' },
        { status: 400 }
      )
    }

    // Get positions for mapping
    let positions: { id: number; name: string; abbreviation?: string }[] = []
    try {
      positions = await supabaseAPI.getPositions()
    } catch (error) {
      console.warn('Could not fetch positions:', error)
    }

    // Create position ID map
    const positionIdMap: { [key: string]: number } = {}
    positions.forEach((pos: any) => {
      positionIdMap[pos.name.toLowerCase()] = pos.id
      if (pos.abbreviation) {
        positionIdMap[pos.abbreviation.toLowerCase()] = pos.id
      }
    })

    // Get user ID from auth context
    let userId = ''
    try {
      const { data: { user } } = await supabaseAPI['getClient']().auth.getUser()
      if (user) {
        userId = user.id
      }
    } catch (error) {
      console.warn('Could not get user ID for import:', error)
    }

    // Prepare players for import
    const playersToImport = validPlayers.map((player: any) => {
      // Map position to positionId
      let positionId = null
      if (player.position?.value) {
        const positionName = player.position.value.toLowerCase()
        positionId = positionIdMap[positionName] || null
      }

      // Construct full name from first/last or use provided name
      let firstName = player.firstName?.value || ''
      let lastName = player.lastName?.value || ''

      if (player.name?.value && (!firstName || !lastName)) {
        const nameParts = player.name.value.trim().split(' ')
        firstName = firstName || nameParts[0] || ''
        lastName = lastName || nameParts.slice(1).join(' ') || ''
      }

      return {
        first_name: firstName,
        last_name: lastName,
        position_id: positionId,
        jersey_number: player.jersey?.value ? player.jersey.value.toString() : '',
        school_year: player.schoolYear?.value as SchoolYear || 'freshman',
        user_id: userId,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    })

    // Import players in batches to avoid overwhelming the database
    const batchSize = 10
    const results = []
    let successCount = 0
    let errorCount = 0
    const errors = []

    // Get the Supabase client
    const client = supabaseAPI['getClient']()

    for (let i = 0; i < playersToImport.length; i += batchSize) {
      const batch = playersToImport.slice(i, i + batchSize)

      for (const playerData of batch) {
        try {
          const { data, error } = await (client as any)
            .from('players')
            .insert(playerData)
            .select()

          if (error) {
            throw error
          }

          successCount++
          results.push({
            success: true,
            player: `${playerData.first_name} ${playerData.last_name}`.trim()
          })
        } catch (error) {
          console.error('Error importing player:', `${playerData.first_name} ${playerData.last_name}`, error)
          errorCount++
          const playerName = `${playerData.first_name} ${playerData.last_name}`.trim()
          errors.push({
            player: playerName,
            error: error instanceof Error ? error.message : 'Unknown error'
          })
          results.push({ success: false, player: playerName, error: error })
        }
      }
    }

    // Clean up import session
    if (typeof globalThis !== 'undefined') {
      // @ts-ignore
      if (globalThis.importSessions) {
        // @ts-ignore
        globalThis.importSessions.delete(importId)
      }
    }

    return NextResponse.json({
      success: true,
      total: playersToImport.length,
      imported: successCount,
      failed: errorCount,
      results: results,
      errors: errors.length > 0 ? errors : undefined
    })

  } catch (error) {
    console.error('Error importing players:', error)
    return NextResponse.json(
      { error: 'Failed to import players. Please try again.' },
      { status: 500 }
    )
  }
}
