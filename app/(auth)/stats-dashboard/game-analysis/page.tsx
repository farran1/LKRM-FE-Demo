'use client';

import React, { useEffect, useState } from 'react';
import { Button, Card, Spin, Alert } from 'antd';
import { HomeOutlined, BarChartOutlined } from '@ant-design/icons';

export default function GameAnalysisIndex() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [games, setGames] = useState<any[]>([]);

  const fetchRecordedGames = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/stats/recorded-games?season=2024-25');
      if (!res.ok) throw new Error(`Failed to fetch recorded games: ${res.status}`);
      const data = await res.json();
      setGames(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load recorded games');
      setGames([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecordedGames();
  }, []);

  if (loading) {
    return (
      <main style={{ padding: '0 24px 24px 0', minHeight: '100vh', background: '#202c3e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Spin size="large" />
      </main>
    );
  }

  if (error) {
    return (
      <main style={{ padding: '0 24px 24px 0', minHeight: '100vh', background: '#202c3e' }}>
        <Alert
          message="Error Loading Recorded Games"
          description={error}
          type="error"
          showIcon
          action={<Button onClick={fetchRecordedGames}>Retry</Button>}
        />
      </main>
    );
  }

  return (
    <main style={{ padding: '0 24px 24px 0', minHeight: '100vh', background: '#202c3e' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '12px 0 20px' }}>
        <h1 style={{ color: '#fff', margin: 0, fontSize: '28px', fontWeight: 600 }}>Game Analysis</h1>
        <Button icon={<HomeOutlined />} onClick={() => { if (typeof window !== 'undefined') window.location.href = '/stats-dashboard'; }}>
          Back to Statistics
        </Button>
      </div>

      {games.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#b0b0b0' }}>No recorded games found.</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
          {games.map((game: any) => (
            <Card
              key={game?.id || Math.random()}
              title={<span style={{ color: '#fff' }}>vs {game?.opponent || 'Unknown'}</span>}
              extra={<span style={{ color: '#b0b0b0' }}>{game?.date ? new Date(game.date).toLocaleDateString() : 'Unknown Date'}</span>}
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ color: '#1890ff', fontSize: 18, fontWeight: 700 }}>{game?.score || '0-0'}</div>
                <Button type="primary" icon={<BarChartOutlined />} onClick={() => {
                  if (game?.id && typeof window !== 'undefined') {
                    window.location.href = `/stats-dashboard/game-analysis/${game.id}`;
                  }
                }}>
                  Analyze
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}



