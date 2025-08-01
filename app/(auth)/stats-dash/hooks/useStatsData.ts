// Custom hooks for stats data management
// Uses SWR for caching, loading states, and error handling

import useSWR from 'swr';
import { statsService, TeamStats, GameStats, PlayerStats, SeasonData } from '../services/statsService';

// Fetcher function for SWR
const fetcher = async (key: string) => {
  const [method, ...params] = key.split(':');
  
  switch (method) {
    case 'teamStats':
      return await statsService.fetchTeamStats(params[0]);
    case 'gameStats':
      return await statsService.fetchGameStats(params[0]);
    case 'playerStats':
      return await statsService.fetchPlayerStats(params[0]);
    case 'seasonData':
      return await statsService.fetchSeasonData(params[0]);
    default:
      throw new Error(`Unknown method: ${method}`);
  }
};

// Hook for team stats
export const useTeamStats = (seasonId: string = '2023-24') => {
  const { data, error, isLoading, mutate } = useSWR<TeamStats>(
    `teamStats:${seasonId}`,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000, // 30 seconds
      errorRetryCount: 3,
    }
  );

  return {
    teamStats: data,
    isLoading,
    error,
    refetch: mutate,
  };
};

// Hook for game stats
export const useGameStats = (seasonId: string = '2023-24') => {
  const { data, error, isLoading, mutate } = useSWR<GameStats[]>(
    `gameStats:${seasonId}`,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
      errorRetryCount: 3,
    }
  );

  return {
    games: data,
    isLoading,
    error,
    refetch: mutate,
  };
};

// Hook for player stats
export const usePlayerStats = (seasonId: string = '2023-24') => {
  const { data, error, isLoading, mutate } = useSWR<PlayerStats[]>(
    `playerStats:${seasonId}`,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
      errorRetryCount: 3,
    }
  );

  return {
    players: data,
    isLoading,
    error,
    refetch: mutate,
  };
};

// Hook for complete season data
export const useSeasonData = (seasonId: string = '2023-24') => {
  const { data, error, isLoading, mutate } = useSWR<SeasonData>(
    `seasonData:${seasonId}`,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1 minute for season data
      errorRetryCount: 3,
    }
  );

  return {
    seasonData: data,
    isLoading,
    error,
    refetch: mutate,
  };
};

// Hook for live game data (future implementation)
export const useLiveGameStats = (gameId: string | null) => {
  const { data, error, isLoading, mutate } = useSWR<GameStats | null>(
    gameId ? `liveGame:${gameId}` : null,
    async () => {
      if (!gameId) return null;
      return await statsService.fetchLiveGameStats(gameId);
    },
    {
      refreshInterval: 5000, // Refresh every 5 seconds for live data
      revalidateOnFocus: true,
      errorRetryCount: 5,
    }
  );

  return {
    liveGameStats: data,
    isLoading,
    error,
    refetch: mutate,
  };
};

// Utility hook for loading states
export const useLoadingStates = (seasonId: string = '2023-24') => {
  const { isLoading: teamLoading } = useTeamStats(seasonId);
  const { isLoading: gamesLoading } = useGameStats(seasonId);
  const { isLoading: playersLoading } = usePlayerStats(seasonId);

  return {
    isLoading: teamLoading || gamesLoading || playersLoading,
    teamLoading,
    gamesLoading,
    playersLoading,
  };
}; 