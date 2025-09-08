import { NextRequest, NextResponse } from 'next/server'
import { SupabaseAPI } from '../../../../src/services/supabase-api'

const supabaseAPI = new SupabaseAPI()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { importId } = body

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

    const { data: players, headers } = importSession

    if (!players || players.length === 0) {
      return NextResponse.json(
        { error: 'No player data found to validate' },
        { status: 400 }
      )
    }

    // Get existing positions for validation
    let positions: { id: number; name: string; abbreviation?: string }[] = []
    try {
      positions = await supabaseAPI.getPositions()
    } catch (error) {
      console.warn('Could not fetch positions for validation:', error)
      // Continue without position validation
    }

    // Validate each player
    const validatedPlayers = players.map((player: any) => {
      const errors: string[] = []
      const warnings: string[] = []

      // Validate name
      if (!player.name && !(player.firstName && player.lastName)) {
        errors.push('Name or First Name + Last Name is required')
      } else if (!player.name) {
        player.name = `${player.firstName || ''} ${player.lastName || ''}`.trim()
      }

      // Validate position
      if (player.position) {
        const positionMap: { [key: string]: string } = {
          'PG': 'Point Guard',
          'SG': 'Shooting Guard',
          'SF': 'Small Forward',
          'PF': 'Power Forward',
          'C': 'Center',
          'Guard': 'Guard',
          'Forward': 'Forward',
          'Center': 'Center'
        }

        const normalizedPosition = player.position.trim()
        if (positionMap[normalizedPosition]) {
          player.position = positionMap[normalizedPosition]
        }

        // Check if position exists in database
        const positionExists = positions.some((pos: any) =>
          pos.name.toLowerCase() === player.position.toLowerCase() ||
          pos.abbreviation?.toLowerCase() === player.position.toLowerCase()
        )

        if (!positionExists) {
          warnings.push(`Position "${player.position}" may not exist in the system`)
        }
      }

      // Validate jersey number
      if (player.jersey) {
        const jerseyNum = parseInt(player.jersey.toString())
        if (isNaN(jerseyNum) || jerseyNum < 0 || jerseyNum > 99) {
          errors.push('Jersey number must be between 0 and 99')
        } else {
          player.jersey = jerseyNum.toString()
        }
      }

      // Validate height format (if provided)
      if (player.height) {
        const heightStr = player.height.toString().trim()
        // Accept formats like "6'2\"", "6'2", "74 inches", "188 cm", etc.
        const heightPattern = /^(\d+)'(\d+)\"?$|^(\d+)\s*(inches?|in|cm)?$/i
        if (!heightPattern.test(heightStr)) {
          warnings.push('Height format should be like "6\'2\"" or "74 inches"')
        }
      }

      // Validate phone number (if provided)
      if (player.phoneNumber) {
        const phoneStr = player.phoneNumber.toString().replace(/\D/g, '')
        if (phoneStr.length < 10 || phoneStr.length > 15) {
          warnings.push('Phone number appears to be invalid')
        }
      }

      return {
        id: player.id,
        rowNumber: player.rowNumber,
        name: {
          value: player.name,
          error: errors.includes('Name or First Name + Last Name is required') ? 'Required' : null
        },
        position: {
          value: player.position,
          error: null,
          warning: warnings.find(w => w.includes('Position'))
        },
        jersey: {
          value: player.jersey,
          error: errors.find(e => e.includes('Jersey number'))
        },
        phoneNumber: {
          value: player.phoneNumber,
          error: null,
          warning: warnings.find(w => w.includes('Phone number'))
        },
        height: {
          value: player.height,
          error: null,
          warning: warnings.find(w => w.includes('Height format'))
        },
        schoolYear: {
          value: player.schoolYear,
          error: null
        },
        errors: errors,
        warnings: warnings,
        isValid: errors.length === 0
      }
    })

    // Summary statistics
    const totalPlayers = validatedPlayers.length
    const validPlayers = validatedPlayers.filter((p: any) => p.isValid).length
    const invalidPlayers = totalPlayers - validPlayers
    const totalWarnings = validatedPlayers.reduce((sum: number, p: any) => sum + p.warnings.length, 0)

    return NextResponse.json({
      data: validatedPlayers,
      summary: {
        total: totalPlayers,
        valid: validPlayers,
        invalid: invalidPlayers,
        warnings: totalWarnings
      },
      headers: headers
    })

  } catch (error) {
    console.error('Error validating import data:', error)
    return NextResponse.json(
      { error: 'Failed to validate import data. Please try again.' },
      { status: 500 }
    )
  }
}
