import React from "react";
import styles from "../style.module.scss";
import { Statistic, Row, Col, Progress } from "antd";

interface TeamStats {
  name: string;
  wins: number;
  losses: number;
  ppg: number;
  oppg: number;
  fgPct: number;
  threePct: number;
  ftPct: number;
}

interface TeamStatsConfig {
  // Shots
  showFieldGoals: boolean;
  showTwoPointers: boolean;
  showThreePointers: boolean;
  showFreeThrows: boolean;
  
  // Points
  showPointsFor: boolean;
  showPointsAgainst: boolean;
  showPointsPerGame: boolean;
  
  // Shooting Efficiencies
  showFGPercent: boolean;
  showTwoPointPercent: boolean;
  showThreePointPercent: boolean;
  showFreeThrowPercent: boolean;
  showEffectiveFGPercent: boolean;
  
  // Shot Type
  showPointsInPaint: boolean;
  
  // Advanced Efficiencies
  showInboundEfficiency: boolean;
  showPlusMinus: boolean;
  showLineupEfficiency: boolean;
  showIndividualMinutes: boolean;
  showValuePointSystem: boolean;
  showPointsPerPossession: boolean;
  showFreeThrowFactor: boolean;
  
  // Rebounding
  showDefensiveRebounds: boolean;
  showDefensiveReboundPercent: boolean;
  showOffensiveRebounds: boolean;
  showOffensiveReboundPercent: boolean;
  showSecondChancePoints: boolean;
  
  // Defense
  showPersonalFouls: boolean;
  showChargesTaken: boolean;
  showBlocks: boolean;
  showSteals: boolean;
  showDeflections: boolean;
  
  // Assists and Turnovers
  showAssists: boolean;
  showTurnovers: boolean;
  showAssistTurnoverRatio: boolean;
  showTurnoverPercent: boolean;
  showPointsOffTurnovers: boolean;
  showTransitionPoints: boolean;
}

interface TeamStatsPanelProps {
  stats: TeamStats;
  config: TeamStatsConfig;
  filters?: { timeframe: string; events: string; players: string };
}

const TeamStatsPanel: React.FC<TeamStatsPanelProps> = ({ stats, config, filters }) => {
  const winRate = (stats.wins / (stats.wins + stats.losses)) * 100;
  
  return (
    <div style={{ width: '100%', height: '100%', overflow: 'hidden', wordBreak: 'break-word', padding: '8px' }}>
      {filters && (
        <div style={{ color: '#bfc9d1', fontSize: 12, marginBottom: 4 }}>
          Filters: {filters.timeframe} | {filters.events} | {filters.players}
        </div>
      )}
      <div style={{ textAlign: 'center', marginBottom: '12px' }}>
        <h3 style={{ 
          margin: 0, 
          fontSize: '1.2rem', 
          fontWeight: 700, 
          color: '#fff',
          textShadow: '0 1px 2px rgba(0,0,0,0.3)'
        }}>
          {stats.name}
        </h3>
        {config.showPointsFor && config.showPointsAgainst && (
          <>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              gap: '6px',
              marginTop: '4px'
            }}>
              <span style={{ 
                color: '#52c41a', 
                fontWeight: 600,
                fontSize: '0.9rem'
              }}>
                {stats.wins}W
              </span>
              <span style={{ color: '#bfc9d1' }}>-</span>
              <span style={{ 
                color: '#ff4d4f', 
                fontWeight: 600,
                fontSize: '0.9rem'
              }}>
                {stats.losses}L
              </span>
            </div>
            <Progress 
              percent={winRate} 
              size="small" 
              strokeColor="#52c41a"
              trailColor="#3a4a5d"
              showInfo={false}
              style={{ marginTop: '4px' }}
            />
          </>
        )}
      </div>

      {(config.showPointsPerGame || config.showPointsAgainst) && (
        <Row gutter={[8, 8]} style={{ marginBottom: '12px' }}>
          {config.showPointsPerGame && (
            <Col span={config.showPointsAgainst ? 12 : 24}>
              <div style={{ 
                background: 'rgba(24, 144, 255, 0.1)', 
                padding: '8px', 
                borderRadius: '6px',
                border: '1px solid rgba(24, 144, 255, 0.2)'
              }}>
                <Statistic 
                  title="PPG" 
                  value={stats.ppg} 
                  precision={1}
                  valueStyle={{ color: '#1890ff', fontSize: '1rem', fontWeight: 600 }}
                />
              </div>
            </Col>
          )}
          {config.showPointsAgainst && (
            <Col span={config.showPointsPerGame ? 12 : 24}>
              <div style={{ 
                background: 'rgba(255, 77, 79, 0.1)', 
                padding: '8px', 
                borderRadius: '6px',
                border: '1px solid rgba(255, 77, 79, 0.2)'
              }}>
                <Statistic 
                  title="OPPG" 
                  value={stats.oppg} 
                  precision={1}
                  valueStyle={{ color: '#ff4d4f', fontSize: '1rem', fontWeight: 600 }}
                />
              </div>
            </Col>
          )}
        </Row>
      )}

      {(config.showFGPercent || config.showThreePointPercent || config.showFreeThrowPercent) && (
        <div style={{ 
          background: 'rgba(82, 196, 26, 0.1)', 
          padding: '10px', 
          borderRadius: '6px',
          border: '1px solid rgba(82, 196, 26, 0.2)'
        }}>
          <h4 style={{ 
            margin: '0 0 8px 0', 
            color: '#52c41a', 
            fontSize: '0.85rem',
            fontWeight: 600
          }}>
            Shooting %
          </h4>
          <Row gutter={[4, 4]}>
            {config.showFGPercent && (
              <Col span={8}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ 
                    fontSize: '0.9rem', 
                    fontWeight: 700, 
                    color: '#52c41a',
                    marginBottom: '2px'
                  }}>
                    {stats.fgPct}%
                  </div>
                  <div style={{ 
                    fontSize: '0.7rem', 
                    color: '#bfc9d1'
                  }}>
                    FG%
                  </div>
                </div>
              </Col>
            )}
            {config.showThreePointPercent && (
              <Col span={8}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ 
                    fontSize: '0.9rem', 
                    fontWeight: 700, 
                    color: '#fa8c16',
                    marginBottom: '2px'
                  }}>
                    {stats.threePct}%
                  </div>
                  <div style={{ 
                    fontSize: '0.7rem', 
                    color: '#bfc9d1'
                  }}>
                    3PT%
                  </div>
                </div>
              </Col>
            )}
            {config.showFreeThrowPercent && (
              <Col span={8}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ 
                    fontSize: '0.9rem', 
                    fontWeight: 700, 
                    color: '#722ed1',
                    marginBottom: '2px'
                  }}>
                    {stats.ftPct}%
                  </div>
                  <div style={{ 
                    fontSize: '0.7rem', 
                    color: '#bfc9d1'
                  }}>
                    FT%
                  </div>
                </div>
              </Col>
            )}
          </Row>
        </div>
      )}
    </div>
  );
};

export default TeamStatsPanel; 