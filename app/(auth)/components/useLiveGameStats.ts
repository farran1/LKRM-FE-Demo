import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

// Replace with your actual Supabase credentials
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type GameStats = {
  gameId: number;
  currentQuarter: number;
  currentPeriod: string | null;
  updatedAt: string | null;
  totals: any;
  players: any[];
  quarters: any[];
};

export function useLiveGameStats(gameId: number) {
  const [stats, setStats] = useState<GameStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    // Initial fetch
    const fetchStats = async () => {
      try {
        const { data, error } = await supabase.rpc('get_game_live_stats', {
          p_game_id: gameId
        });

        if (error) throw error;
        if (mounted) {
          setStats(data);
          setLoading(false);
        }
      } catch (err: any) {
        if (mounted) {
          setError(err.message);
          setLoading(false);
        }
      }
    };

    fetchStats();

    // Subscribe to real-time changes
    const channel = supabase.channel(`game-stats-${gameId}`)
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'game_stats',
          filter: `gameId=eq.${gameId}`
        },
        async (payload) => {
          console.log('Game stats changed:', payload);
          // Re-fetch stats when data changes
          await fetchStats();
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [gameId]);

  return { stats, loading, error };
}

