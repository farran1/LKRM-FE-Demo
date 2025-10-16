'use client';

import React from 'react';
import { Card, Progress, Badge, Tooltip, Button } from 'antd';
import { 
  ArrowUpOutlined as TrendingUpOutlined, 
  ArrowDownOutlined as TrendingDownOutlined, 
  MinusOutlined,
  EyeOutlined,
  EditOutlined
} from '@ant-design/icons';
import { Line } from '@ant-design/plots';
import style from '../../style.module.scss';

interface GoalCardProps {
  goal: {
    id: number;
    target_value: number;
    comparison_operator: string;
    period_type: string;
    season: string;
    visibility: string;
    notes?: string;
    stat_metrics: {
      id: number;
      name: string;
      category: string;
      description: string;
      unit: string;
      calculation_type: string;
      event_types: string[];
    };
    currentProgress?: {
      actualValue: number;
      targetValue: number;
      delta: number;
      status: 'on_track' | 'at_risk' | 'off_track';
      lastCalculated: string;
    };
    trends: Array<{
      value: number;
      date: string;
      game: string;
      opponent: string;
    }>;
  };
  onViewDetails: (goalId: number) => void;
  onEdit: (goalId: number) => void;
}

const GoalCard: React.FC<GoalCardProps> = ({ goal, onViewDetails, onEdit }) => {
  const { stat_metrics, currentProgress, trends } = goal;
  
  // Status colors
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'on_track': return '#52c41a';
      case 'at_risk': return '#faad14';
      case 'off_track': return '#f5222d';
      default: return '#d9d9d9';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'on_track': return 'On Track';
      case 'at_risk': return 'At Risk';
      case 'off_track': return 'Off Track';
      default: return 'Unknown';
    }
  };

  // Format operator for display
  const getOperatorSymbol = (operator: string) => {
    switch (operator) {
      case 'gte': return '≥';
      case 'lte': return '≤';
      case 'eq': return '=';
      default: return operator;
    }
  };

  // Format period type for display
  const getPeriodText = (periodType: string) => {
    switch (periodType) {
      case 'per_game': return 'per game';
      case 'season_total': return 'season total';
      case 'rolling_5': return 'rolling 5 games';
      case 'rolling_10': return 'rolling 10 games';
      default: return periodType;
    }
  };

  // Calculate progress percentage for progress bar
  const getProgressPercentage = () => {
    if (!currentProgress) return 0;
    
    const { actualValue, targetValue } = currentProgress as any;
    const comparison_operator = (goal as any).comparison_operator || (currentProgress as any).comparison_operator || 'gte';
    
    switch (comparison_operator) {
      case 'gte':
        return Math.min((actualValue / targetValue) * 100, 100);
      case 'lte':
        return Math.min((actualValue / targetValue) * 100, 100);
      case 'eq':
        return Math.min((actualValue / targetValue) * 100, 100);
      default:
        return 0;
    }
  };

  // Generate trend chart data
  const chartData = trends.map((trend, index) => ({
    game: index + 1,
    value: trend.value,
    date: trend.date
  })).reverse(); // Show oldest to newest

  const config = {
    data: chartData,
    xField: 'game',
    yField: 'value',
    point: {
      size: 3,
      shape: 'circle',
    },
    line: {
      size: 2,
    },
    smooth: true,
    tooltip: {
      formatter: (datum: any) => {
        return {
          name: 'Value',
          value: `${datum.value.toFixed(1)} ${stat_metrics.unit}`,
        };
      },
    },
    height: 60,
    padding: [10, 10, 10, 10],
  };

  return (
    <Card
      className={style.goalCard}
      size="small"
      title={
        <div className={style.goalCardHeader}>
          <div className={style.goalTitle}>
            <span className={style.metricName}>{stat_metrics.name}</span>
            <Badge 
              color={getStatusColor(currentProgress?.status || 'off_track')} 
              text={getStatusText(currentProgress?.status || 'off_track')}
              className={style.statusBadge}
            />
          </div>
          <div className={style.goalActions}>
            <Tooltip title="View Details">
              <Button 
                type="text" 
                size="small" 
                icon={<EyeOutlined />}
                onClick={() => onViewDetails(goal.id)}
              />
            </Tooltip>
            <Tooltip title="Edit Goal">
              <Button 
                type="text" 
                size="small" 
                icon={<EditOutlined />}
                onClick={() => onEdit(goal.id)}
              />
            </Tooltip>
          </div>
        </div>
      }
    >
      <div className={style.goalContent}>
        {/* Target Display */}
        <div className={style.targetDisplay}>
          <span className={style.targetLabel}>Target:</span>
          <span className={style.targetValue}>
            {getOperatorSymbol(goal.comparison_operator)} {goal.target_value} {stat_metrics.unit}
          </span>
          <span className={style.periodType}>({getPeriodText(goal.period_type)})</span>
        </div>

        {/* Current Progress */}
        {currentProgress ? (
          <div className={style.currentProgress}>
            <div className={style.progressRow}>
              <span className={style.currentLabel}>Current:</span>
              <span className={style.currentValue}>
                {currentProgress.actualValue.toFixed(1)} {stat_metrics.unit}
              </span>
              <span className={`${style.delta} ${currentProgress.delta >= 0 ? style.positive : style.negative}`}>
                {currentProgress.delta >= 0 ? (
                  <TrendingUpOutlined />
                ) : (
                  <TrendingDownOutlined />
                )}
                {Math.abs(currentProgress.delta).toFixed(1)}
              </span>
            </div>
            
            {/* Progress Bar */}
            <Progress
              percent={getProgressPercentage()}
              strokeColor={getStatusColor(currentProgress.status)}
              showInfo={false}
              size="small"
            />
          </div>
        ) : (
          <div className={style.noData}>
            <MinusOutlined />
            <span>No data available</span>
          </div>
        )}

        {/* Trend Chart */}
        {trends.length > 0 && (
          <div className={style.trendChart}>
            <Line {...config} />
          </div>
        )}

        {/* Category Badge */}
        <div className={style.categoryBadge}>
          <Badge 
            color={stat_metrics.category === 'offense' ? '#1890ff' : 
                   stat_metrics.category === 'defense' ? '#f5222d' :
                   stat_metrics.category === 'efficiency' ? '#52c41a' : '#722ed1'}
            text={stat_metrics.category.charAt(0).toUpperCase() + stat_metrics.category.slice(1)}
          />
        </div>
      </div>
    </Card>
  );
};

export default GoalCard;
