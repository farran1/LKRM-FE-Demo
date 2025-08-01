// Stats-Dash Mock Data
// Log: COMPONENT_LOG.md (utils/mockData.ts)

// --- Interfaces ---
export interface Player {
  id: number;
  name: string;
  position: string;
  jerseyNumber: string;
  seasonYear: string;
}

export interface Game {
  id: number;
  date: string;
  opponent: string;
  homeAway: 'home' | 'away';
  finalScoreUs: number;
  finalScoreThem: number;
}

export interface GameEvent {
  id: number;
  gameId: number;
  playerId: number;
  eventType: string;
  timestamp: string;
  period: number;
  value?: number;
  details?: string;
}

// --- Mock Data ---
export const mockPlayers: Player[] = [
  { id: 1, name: 'John Smith', position: 'PG', jerseyNumber: '10', seasonYear: '2024' },
  { id: 2, name: 'Mike Johnson', position: 'SG', jerseyNumber: '15', seasonYear: '2024' },
  { id: 3, name: 'David Wilson', position: 'SF', jerseyNumber: '23', seasonYear: '2024' },
  { id: 4, name: 'Chris Brown', position: 'PF', jerseyNumber: '32', seasonYear: '2024' },
  { id: 5, name: 'Alex Davis', position: 'C', jerseyNumber: '44', seasonYear: '2024' },
];

export const mockGames: Game[] = [
  { id: 1, date: '2024-01-10', opponent: 'Central High', homeAway: 'home', finalScoreUs: 68, finalScoreThem: 62 },
  { id: 2, date: '2024-01-17', opponent: 'Westview', homeAway: 'away', finalScoreUs: 55, finalScoreThem: 60 },
];

export const mockEvents: GameEvent[] = [
  { id: 1, gameId: 1, playerId: 1, eventType: '2PT_MADE', timestamp: '2024-01-10T19:01:00Z', period: 1, value: 2 },
  { id: 2, gameId: 1, playerId: 2, eventType: 'ASSIST', timestamp: '2024-01-10T19:01:00Z', period: 1 },
  { id: 3, gameId: 1, playerId: 3, eventType: 'REBOUND', timestamp: '2024-01-10T19:02:00Z', period: 1 },
  { id: 4, gameId: 1, playerId: 1, eventType: '3PT_MADE', timestamp: '2024-01-10T19:03:00Z', period: 1, value: 3 },
  { id: 5, gameId: 2, playerId: 4, eventType: 'FOUL', timestamp: '2024-01-17T19:05:00Z', period: 2 },
]; 