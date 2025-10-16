// Custom hooks for stats data management
// Uses SWR for caching, loading states, and error handling

import useSWR from 'swr';
import { statsService, TeamStats, GameStats, PlayerStats, SeasonData } from '../services/statsService';

// Type-safe fetchers for each data type
const teamStatsFetcher = async (key: string) => {
  const seasonId = key.split(':')[1];
  return await statsService.fetchTeamStats(seasonId);
};

const gameStatsFetcher = async (key: string) => {
  const seasonId = key.split(':')[1];
  return await statsService.fetchGameStats(seasonId);
};

const playerStatsFetcher = async (key: string) => {
  const seasonId = key.split(':')[1];
  return await statsService.fetchPlayerStats(seasonId);
};

const seasonDataFetcher = async (key: string) => {
  const seasonId = key.split(':')[1];
  return await statsService.fetchSeasonData(seasonId);
};

// Hook for team stats
export const useTeamStats = (seasonId: string = '2023-24') => {
  const { data, error, isLoading, mutate } = useSWR<TeamStats>(
    `teamStats:${seasonId}`,
    teamStatsFetcher,
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
    gameStatsFetcher,
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
    playerStatsFetcher,
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
    seasonDataFetcher,
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