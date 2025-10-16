// Data service layer for stats dashboard
// Handles API calls, data transformation, and caching

export interface TeamStats {
  id: string;
  name: string;
  season: string;
  gamesPlayed: number;
  wins: number;
  losses: number;
  winPercentage: number;
  pointsFor: number;
  pointsAgainst: number;
  avgPointsFor: number;
  avgPointsAgainst: number;
  pointDifferential: number;
  lastFiveGames: string[]; // ['W', 'L', 'W', 'W', 'L']
}

export interface GameStats {
  id: string;
  date: string;
  opponent: string;
  homeAway: 'home' | 'away';
  finalScoreUs: number;
  finalScoreThem: number;
  result: 'W' | 'L';
  margin: number;
  quarterScores: {
    q1: { us: number; them: number };
    q2: { us: number; them: number };
    q3: { us: number; them: number };
    q4: { us: number; them: number };
  };
  keyStats: {
    fieldGoalPercentage: number;
    threePointPercentage: number;
    freeThrowPercentage: number;
    rebounds: number;
    assists: number;
    turnovers: number;
  };
}

export interface PlayerStats {
  id: string;
  name: string;
  position: string;
  jerseyNumber: number;
  gamesPlayed: number;
  points: number;
  avgPoints: number;
  rebounds: number;
  avgRebounds: number;
  assists: number;
  avgAssists: number;
  steals: number;
  avgSteals: number;
  blocks: number;
  avgBlocks: number;
  fieldGoalPercentage: number;
  threePointPercentage: number;
  freeThrowPercentage: number;
  minutesPlayed: number;
  avgMinutes: number;
}

export interface SeasonData {
  id: string;
  year: string;
  teamStats: TeamStats;
  games: GameStats[];
  players: PlayerStats[];
  trends: {
    offensiveEfficiency: number;
    defensiveEfficiency: number;
    pace: number;
    strengthOfSchedule: number;
  };
}

// Real data service backed by API
import api from '@/services/api'

class StatsService {

  // API Methods
  async fetchTeamStats(seasonId: string = '2024-25'): Promise<TeamStats> {
    const gamesRes = await api.get('/api/games', { params: { season: seasonId } })
    const games = ((gamesRes?.data as any)?.data ?? []) as any[]
    const wins = games.filter(g => (g.result ?? '').toUpperCase() === 'WIN').length
    const losses = games.filter(g => (g.result ?? '').toUpperCase() === 'LOSS').length
    const pointsFor = games.reduce((s,g)=>s+(g.homeScore||0),0)
    const pointsAgainst = games.reduce((s,g)=>s+(g.awayScore||0),0)
    const teamStats: TeamStats = {
      id: 'team-1',
      name: 'Team',
      season: seasonId,
      gamesPlayed: games.length,
      wins,
      losses,
      winPercentage: games.length ? (wins/games.length)*100 : 0,
      pointsFor,
      pointsAgainst,
      avgPointsFor: games.length ? Math.round(pointsFor/games.length) : 0,
      avgPointsAgainst: games.length ? Math.round(pointsAgainst/games.length) : 0,
      pointDifferential: pointsFor - pointsAgainst,
      lastFiveGames: games.slice(-5).map(g => ((g.result ?? '').toUpperCase()==='WIN'?'W':'L'))
    }
    return teamStats
  }

  async fetchGameStats(seasonId: string = '2024-25'): Promise<GameStats[]> {
    const res = await api.get('/api/games', { params: { season: seasonId } })
    const games = ((res?.data as any)?.data ?? []) as any[]
    return games.map(g => ({
      id: String(g.id),
      date: g.gameDate || g.createdAt,
      opponent: g.opponent,
      homeAway: (g.location ?? 'HOME').toLowerCase() === 'home' ? 'home' : 'away',
      finalScoreUs: g.homeScore ?? 0,
      finalScoreThem: g.awayScore ?? 0,
      result: (g.result ?? ( (g.homeScore||0) >= (g.awayScore||0) ? 'W':'L')).toUpperCase()==='WIN'?'W':'L',
      margin: (g.homeScore||0)-(g.awayScore||0),
      quarterScores: { q1:{us:0,them:0}, q2:{us:0,them:0}, q3:{us:0,them:0}, q4:{us:0,them:0} },
      keyStats: { fieldGoalPercentage:0, threePointPercentage:0, freeThrowPercentage:0, rebounds:0, assists:0, turnovers:0 }
    }))
  }

  async fetchPlayerStats(seasonId: string = '2024-25'): Promise<PlayerStats[]> {
    const playersRes = await api.get('/api/players')
    const players = ((playersRes?.data as any)?.data ?? []) as any[]
    const statsRes = await api.get('/api/game-stats', { params: { season: seasonId } })
    const rows = ((statsRes?.data as any)?.data ?? []) as any[]
    const agg = new Map<string, any>()
    rows.forEach(r => {
      const key = String(r.playerId)
      const x = agg.get(key) || { g:0, pts:0, reb:0, ast:0, stl:0, blk:0, min:0, fgm:0, fga:0, tpm:0, tpa:0, ftm:0, fta:0 }
      x.g += 1
      x.pts += r.points||0
      x.reb += r.rebounds||0
      x.ast += r.assists||0
      x.stl += r.steals||0
      x.blk += r.blocks||0
      x.min += r.minutesPlayed||0
      x.fgm += r.fieldGoalsMade||0
      x.fga += r.fieldGoalsAttempted||0
      x.tpm += r.threePointsMade||0
      x.tpa += r.threePointsAttempted||0
      x.ftm += r.freeThrowsMade||0
      x.fta += r.freeThrowsAttempted||0
      agg.set(key, x)
    })
    return players.map(p => {
      const a = agg.get(String(p.id)) || { g:0, pts:0, reb:0, ast:0, stl:0, blk:0, min:0, fgm:0, fga:0, tpm:0, tpa:0, ftm:0, fta:0 }
      const gp = Math.max(1, a.g)
      return {
        id: String(p.id),
        name: p.name || `${p.first_name??''} ${p.last_name??''}`.trim(),
        position: p.position?.name || '',
        jerseyNumber: Number(p.jersey_number || p.jersey || 0),
        gamesPlayed: a.g,
        points: a.pts,
        avgPoints: a.pts/gp,
        rebounds: a.reb,
        avgRebounds: a.reb/gp,
        assists: a.ast,
        avgAssists: a.ast/gp,
        steals: a.stl,
        avgSteals: a.stl/gp,
        blocks: a.blk,
        avgBlocks: a.blk/gp,
        fieldGoalPercentage: a.fga? a.fgm/a.fga:0,
        threePointPercentage: a.tpa? a.tpm/a.tpa:0,
        freeThrowPercentage: a.fta? a.ftm/a.fta:0,
        minutesPlayed: a.min,
        avgMinutes: a.min/gp
      }
    })
  }

  async fetchSeasonData(seasonId: string = '2024-25'): Promise<SeasonData> {
    const [teamStats, games, players] = await Promise.all([
      this.fetchTeamStats(seasonId),
      this.fetchGameStats(seasonId),
      this.fetchPlayerStats(seasonId)
    ])
    return {
      id: seasonId,
      year: seasonId,
      teamStats,
      games,
      players,
      trends: {
        offensiveEfficiency: teamStats.avgPointsFor,
        defensiveEfficiency: teamStats.avgPointsAgainst,
        pace: 0,
        strengthOfSchedule: 0
      }
    }
  }

  // Real-time data methods (for future implementation)
  async subscribeToLiveGame(gameId: string): Promise<void> {
    // WebSocket connection for live game updates
    console.log(`Subscribing to live game: ${gameId}`);
  }

  async fetchLiveGameStats(gameId: string): Promise<GameStats | null> {
    // Real-time game stats
    return null;
  }
}

// Export singleton instance
export const statsService = new StatsService(); 