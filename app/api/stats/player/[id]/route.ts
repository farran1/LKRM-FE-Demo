import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!url || !anon) {
      return NextResponse.json({ error: 'Supabase environment variables are missing' }, { status: 500 })
    }

    const supabase = createClient(url, anon)
    const { id } = await params
    const playerId = parseInt(id)
    if (Number.isNaN(playerId)) {
      return NextResponse.json({ error: 'Invalid player id' }, { status: 400 })
    }

    const { searchParams } = new URL(request.url)
    const season = searchParams.get('season') || '2024-25'
    const timeRange = searchParams.get('timeRange') || 'season'
    const startDate = searchParams.get('startDate') || undefined
    const endDate = searchParams.get('endDate') || undefined

    // Fetch games for the season/time window
    let gamesQuery = supabase
      .from('games')
      .select('id, gameDate')
      .eq('season', season)
      .order('gameDate', { ascending: true })

    if (startDate) gamesQuery = gamesQuery.gte('gameDate', startDate)
    if (endDate) gamesQuery = gamesQuery.lte('gameDate', endDate)

    const { data: allGames, error: gamesError } = await gamesQuery
    if (gamesError) {
      console.error('Error fetching games:', gamesError)
      return NextResponse.json({ error: 'Failed to fetch games' }, { status: 500 })
    }

    let games = allGames || []
    if (timeRange === 'last5' || timeRange === 'last10') {
      const limit = timeRange === 'last5' ? 5 : 10
      games = [...games].sort((a: any, b: any) => (new Date(a.gameDate).getTime()) - (new Date(b.gameDate).getTime()))
      games = games.slice(-limit)
    } else if (timeRange === 'last30days') {
      const now = new Date()
      const cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      games = (games || []).filter((g: any) => new Date(g.gameDate) >= cutoff)
    }

    if (!games || games.length === 0) {
      return NextResponse.json({
        playerId,
        games: 0,
        points: 0,
        assists: 0,
        rebounds: 0,
        steals: 0,
        blocks: 0,
        fouls: 0,
        turnovers: 0,
        fg: { made: 0, att: 0, pct: 0 },
        tp: { made: 0, att: 0, pct: 0 },
        ft: { made: 0, att: 0, pct: 0 },
        recentGames: []
      })
    }

    const gameIds = games.map((g: any) => g.id)
    const gameDateById = new Map<number, string>()
    games.forEach((g: any) => gameDateById.set(g.id, g.gameDate))

    // Fetch game_stats for this player and the selected games
    const { data: rows, error: statsError } = await supabase
      .from('game_stats')
      .select('*')
      .eq('playerId', playerId)
      .in('gameId', gameIds)

    if (statsError) {
      console.error('Error fetching player game stats:', statsError)
      return NextResponse.json({ error: 'Failed to fetch player stats' }, { status: 500 })
    }

    const stats = rows || []
    const totals = stats.reduce((acc: any, r: any) => {
      acc.games += 1
      acc.points += r.points || 0
      acc.assists += r.assists || 0
      acc.rebounds += r.rebounds || 0
      acc.steals += r.steals || 0
      acc.blocks += r.blocks || 0
      acc.fouls += r.fouls || 0
      acc.turnovers += r.turnovers || 0
      acc.fg.made += r.fieldGoalsMade || 0
      acc.fg.att += r.fieldGoalsAttempted || 0
      acc.tp.made += r.threePointsMade || 0
      acc.tp.att += r.threePointsAttempted || 0
      acc.ft.made += r.freeThrowsMade || 0
      acc.ft.att += r.freeThrowsAttempted || 0
      return acc
    }, {
      games: 0,
      points: 0,
      assists: 0,
      rebounds: 0,
      steals: 0,
      blocks: 0,
      fouls: 0,
      turnovers: 0,
      fg: { made: 0, att: 0 },
      tp: { made: 0, att: 0 },
      ft: { made: 0, att: 0 }
    })

    const pct = (m: number, a: number) => (a > 0 ? Math.round((m / a) * 1000) / 10 : 0)

    const recentGames = stats
      .map((r: any) => ({
        gameId: r.gameId,
        date: gameDateById.get(r.gameId) || null,
        points: r.points || 0,
        fgPct: pct(r.fieldGoalsMade || 0, r.fieldGoalsAttempted || 0)
      }))
      .sort((a, b) => {
        const ad = a.date ? new Date(a.date).getTime() : 0
        const bd = b.date ? new Date(b.date).getTime() : 0
        return ad - bd
      })

    const perGame = stats.map((r: any) => ({
      gameId: r.gameId,
      date: gameDateById.get(r.gameId) || null,
      points: r.points || 0,
      rebounds: r.rebounds || 0,
      assists: r.assists || 0,
      steals: r.steals || 0,
      blocks: r.blocks || 0,
      turnovers: r.turnovers || 0,
      fouls: r.fouls || 0,
      fgMade: r.fieldGoalsMade || 0,
      fgAtt: r.fieldGoalsAttempted || 0,
      tpMade: r.threePointsMade || 0,
      tpAtt: r.threePointsAttempted || 0,
      ftMade: r.freeThrowsMade || 0,
      ftAtt: r.freeThrowsAttempted || 0
    })).sort((a: any, b: any) => {
      const ad = a.date ? new Date(a.date).getTime() : 0
      const bd = b.date ? new Date(b.date).getTime() : 0
      return ad - bd
    })

    return NextResponse.json({
      playerId,
      games: totals.games,
      points: totals.points,
      assists: totals.assists,
      rebounds: totals.rebounds,
      steals: totals.steals,
      blocks: totals.blocks,
      fouls: totals.fouls,
      turnovers: totals.turnovers,
      fg: { made: totals.fg.made, att: totals.fg.att, pct: pct(totals.fg.made, totals.fg.att) },
      tp: { made: totals.tp.made, att: totals.tp.att, pct: pct(totals.tp.made, totals.tp.att) },
      ft: { made: totals.ft.made, att: totals.ft.att, pct: pct(totals.ft.made, totals.ft.att) },
      recentGames,
      perGame
    })
  } catch (error) {
    console.error('Error in player stats endpoint:', error)
    return NextResponse.json({ error: 'Failed to fetch player stats' }, { status: 500 })
  }
}


