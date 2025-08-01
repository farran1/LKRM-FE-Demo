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

// Mock data service - will be replaced with real API calls
class StatsService {
  private mockData: {
    teamStats: TeamStats;
    games: GameStats[];
    players: PlayerStats[];
  };

  constructor() {
    this.mockData = this.generateMockData();
  }

  private generateMockData() {
    const games: GameStats[] = [
      {
        id: '1',
        date: '2024-01-15',
        opponent: 'Central High',
        homeAway: 'home',
        finalScoreUs: 72,
        finalScoreThem: 65,
        result: 'W',
        margin: 7,
        quarterScores: {
          q1: { us: 18, them: 16 },
          q2: { us: 20, them: 18 },
          q3: { us: 16, them: 14 },
          q4: { us: 18, them: 17 }
        },
        keyStats: {
          fieldGoalPercentage: 0.485,
          threePointPercentage: 0.375,
          freeThrowPercentage: 0.750,
          rebounds: 32,
          assists: 18,
          turnovers: 12
        }
      },
      {
        id: '2',
        date: '2024-01-18',
        opponent: 'East Valley',
        homeAway: 'away',
        finalScoreUs: 68,
        finalScoreThem: 71,
        result: 'L',
        margin: -3,
        quarterScores: {
          q1: { us: 16, them: 18 },
          q2: { us: 18, them: 20 },
          q3: { us: 17, them: 16 },
          q4: { us: 17, them: 17 }
        },
        keyStats: {
          fieldGoalPercentage: 0.420,
          threePointPercentage: 0.300,
          freeThrowPercentage: 0.800,
          rebounds: 28,
          assists: 15,
          turnovers: 14
        }
      },
      {
        id: '3',
        date: '2024-01-22',
        opponent: 'Westside High',
        homeAway: 'home',
        finalScoreUs: 85,
        finalScoreThem: 78,
        result: 'W',
        margin: 7,
        quarterScores: {
          q1: { us: 22, them: 20 },
          q2: { us: 21, them: 19 },
          q3: { us: 20, them: 18 },
          q4: { us: 22, them: 21 }
        },
        keyStats: {
          fieldGoalPercentage: 0.520,
          threePointPercentage: 0.400,
          freeThrowPercentage: 0.850,
          rebounds: 35,
          assists: 22,
          turnovers: 10
        }
      }
    ];

    const players: PlayerStats[] = [
      {
        id: '1',
        name: 'Mike Johnson',
        position: 'PG',
        jerseyNumber: 3,
        gamesPlayed: 3,
        points: 45,
        avgPoints: 15.0,
        rebounds: 8,
        avgRebounds: 2.7,
        assists: 12,
        avgAssists: 4.0,
        steals: 5,
        avgSteals: 1.7,
        blocks: 1,
        avgBlocks: 0.3,
        fieldGoalPercentage: 0.480,
        threePointPercentage: 0.380,
        freeThrowPercentage: 0.820,
        minutesPlayed: 72,
        avgMinutes: 24.0
      },
      {
        id: '2',
        name: 'David Smith',
        position: 'SG',
        jerseyNumber: 12,
        gamesPlayed: 3,
        points: 52,
        avgPoints: 17.3,
        rebounds: 15,
        avgRebounds: 5.0,
        assists: 8,
        avgAssists: 2.7,
        steals: 3,
        avgSteals: 1.0,
        blocks: 2,
        avgBlocks: 0.7,
        fieldGoalPercentage: 0.520,
        threePointPercentage: 0.420,
        freeThrowPercentage: 0.780,
        minutesPlayed: 78,
        avgMinutes: 26.0
      },
      {
        id: '3',
        name: 'Chris Wilson',
        position: 'SF',
        jerseyNumber: 24,
        gamesPlayed: 3,
        points: 38,
        avgPoints: 12.7,
        rebounds: 18,
        avgRebounds: 6.0,
        assists: 6,
        avgAssists: 2.0,
        steals: 4,
        avgSteals: 1.3,
        blocks: 3,
        avgBlocks: 1.0,
        fieldGoalPercentage: 0.450,
        threePointPercentage: 0.350,
        freeThrowPercentage: 0.750,
        minutesPlayed: 75,
        avgMinutes: 25.0
      }
    ];

    const wins = games.filter(g => g.result === 'W').length;
    const losses = games.filter(g => g.result === 'L').length;
    const totalPointsFor = games.reduce((sum, g) => sum + g.finalScoreUs, 0);
    const totalPointsAgainst = games.reduce((sum, g) => sum + g.finalScoreThem, 0);

    const teamStats: TeamStats = {
      id: 'team-1',
      name: 'Lincoln High School',
      season: '2023-24',
      gamesPlayed: games.length,
      wins,
      losses,
      winPercentage: (wins / games.length) * 100,
      pointsFor: totalPointsFor,
      pointsAgainst: totalPointsAgainst,
      avgPointsFor: Math.round(totalPointsFor / games.length),
      avgPointsAgainst: Math.round(totalPointsAgainst / games.length),
      pointDifferential: totalPointsFor - totalPointsAgainst,
      lastFiveGames: ['W', 'L', 'W', 'W', 'L']
    };

    return { teamStats, games, players };
  }

  // API Methods
  async fetchTeamStats(seasonId: string = '2023-24'): Promise<TeamStats> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return this.mockData.teamStats;
  }

  async fetchGameStats(seasonId: string = '2023-24'): Promise<GameStats[]> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return this.mockData.games;
  }

  async fetchPlayerStats(seasonId: string = '2023-24'): Promise<PlayerStats[]> {
    await new Promise(resolve => setTimeout(resolve, 400));
    return this.mockData.players;
  }

  async fetchSeasonData(seasonId: string = '2023-24'): Promise<SeasonData> {
    await new Promise(resolve => setTimeout(resolve, 600));
    return {
      id: seasonId,
      year: seasonId,
      teamStats: this.mockData.teamStats,
      games: this.mockData.games,
      players: this.mockData.players,
      trends: {
        offensiveEfficiency: 108.5,
        defensiveEfficiency: 102.3,
        pace: 68.2,
        strengthOfSchedule: 0.485
      }
    };
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