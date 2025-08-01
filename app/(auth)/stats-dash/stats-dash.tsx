'use client'
import React from 'react';
import { Row, Col, Spin, Alert } from 'antd';
import TeamStatsPanel from './components/TeamStatsPanel';
import GameStatsPanel from './components/GameStatsPanel';
import PlayerComparisonPanel from './components/PlayerComparisonPanel';
import { useLoadingStates } from './hooks/useStatsData';
import style from './style.module.scss';

const StatsDashboard2 = () => {
  const { isLoading, teamLoading, gamesLoading, playersLoading } = useLoadingStates();

  // Show loading state if any data is loading
  if (isLoading) {
    return (
      <div className={style.dashboard}>
        <div style={{ textAlign: 'center', padding: '100px 0' }}>
          <Spin size="large" />
          <div style={{ marginTop: 16, color: '#b8c5d3' }}>
            Loading dashboard data...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={style.dashboard}>
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={8}>
          <TeamStatsPanel />
        </Col>
        <Col xs={24} lg={8}>
          <GameStatsPanel />
        </Col>
        <Col xs={24} lg={8}>
          <PlayerComparisonPanel />
        </Col>
      </Row>
    </div>
  );
};

export default StatsDashboard2; 