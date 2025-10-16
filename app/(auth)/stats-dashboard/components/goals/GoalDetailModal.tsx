'use client';

import React, { useState, useEffect } from 'react';
import { 
  Modal, 
  Card, 
  Table, 
  Button, 
  Spin, 
  Alert, 
  Row, 
  Col,
  Tag,
  Tooltip,
  message
} from 'antd';
import { supabase } from '@/lib/supabase';
import { 
  EditOutlined, 
  DownloadOutlined, 
  ReloadOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  MinusOutlined
} from '@ant-design/icons';
// import { Line } from '@ant-design/plots';

interface GoalDetailModalProps {
  open: boolean;
  onClose: () => void;
  goalId: number | null;
  onEdit: (goalId: number) => void;
}

interface GoalDetail {
  goal: {
    id: number;
    target_value: number;
    comparison_operator: string;
    period_type: string;
    season: string;
    visibility: string;
    notes?: string;
    created_at: string;
    stat_metrics: {
      id: number;
      name: string;
      category: string;
      description: string;
      unit: string;
      calculation_type: string;
      event_types: string[];
    };
  };
  progress: Array<{
    id: number;
    actual_value: number;
    target_value: number;
    delta: number;
    status: 'on_track' | 'at_risk' | 'off_track';
    calculated_at: string;
    live_game_sessions: {
      id: number;
      created_at: string;
      events: {
        name: string;
        startTime: string;
        oppositionTeam: string;
      };
    };
  }>;
  totalCount: number;
  limit: number;
  offset: number;
}

const GoalDetailModal: React.FC<GoalDetailModalProps> = ({
  open,
  onClose,
  goalId,
  onEdit
}) => {
  const [goalDetail, setGoalDetail] = useState<GoalDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [LineChart, setLineChart] = useState<any>(null);

  useEffect(() => {
    if (open && goalId) {
      fetchGoalDetail();
    }
  }, [open, goalId]);

  // Dynamically load Line chart component
  useEffect(() => {
    const loadLineChart = async () => {
      try {
        const { Line } = await import('@ant-design/plots');
        setLineChart(() => Line);
      } catch (error) {
        console.error('Failed to load Line chart:', error);
      }
    };
    loadLineChart();
  }, []);

  const fetchGoalDetail = async () => {
    if (!goalId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Get authentication token for API calls
      const { data: { session } } = await supabase.auth.getSession()
      const authHeaders: HeadersInit = session?.access_token ? {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      } : {
        'Content-Type': 'application/json'
      }
      
      const response = await fetch(`/api/stats/team-goals/${goalId}/progress?limit=50`, {
        headers: authHeaders
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch goal details');
      }
      
      const data = await response.json();
      setGoalDetail(data);
    } catch (err) {
      console.error('Error fetching goal details:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch goal details');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    if (goalId) {
      onEdit(goalId);
      onClose();
    }
  };

  const handleRefresh = () => {
    fetchGoalDetail();
  };

  const handleExport = () => {
    if (!goalDetail) return;
    
    // Create CSV content
    const headers = ['Game', 'Date', 'Opponent', 'Actual', 'Target', 'Delta', 'Status'];
    const rows = goalDetail.progress.map(p => [
      p.live_game_sessions.events.name,
      new Date(p.live_game_sessions.created_at).toLocaleDateString(),
      p.live_game_sessions.events.oppositionTeam,
      p.actual_value.toFixed(1),
      p.target_value.toFixed(1),
      p.delta.toFixed(1),
      p.status
    ]);
    
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `goal-${goalDetail.goal.stat_metrics.name.toLowerCase().replace(/\s+/g, '-')}-progress.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    message.success('Progress data exported successfully');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'on_track': return 'success';
      case 'at_risk': return 'warning';
      case 'off_track': return 'error';
      default: return 'default';
    }
  };

  const getOperatorSymbol = (operator: string) => {
    switch (operator) {
      case 'gte': return '≥';
      case 'lte': return '≤';
      case 'eq': return '=';
      default: return operator;
    }
  };

  const getPeriodText = (periodType: string) => {
    switch (periodType) {
      case 'per_game': return 'per game';
      case 'season_total': return 'season total';
      case 'rolling_5': return 'rolling 5 games';
      case 'rolling_10': return 'rolling 10 games';
      default: return periodType;
    }
  };

  // Prepare chart data
  const chartData = goalDetail?.progress.map((p, index) => ({
    game: index + 1,
    actual: p.actual_value,
    target: p.target_value,
    date: p.calculated_at
  })).reverse() || [];

  const chartConfig = {
    data: chartData,
    xField: 'game',
    yField: 'actual',
    point: {
      size: 4,
      shape: 'circle',
    },
    line: {
      size: 2,
    },
    smooth: true,
    tooltip: {
      formatter: (datum: any) => {
        return [
          { name: 'Actual', value: `${datum.actual.toFixed(1)} ${goalDetail?.goal.stat_metrics.unit}` },
          { name: 'Target', value: `${datum.target.toFixed(1)} ${goalDetail?.goal.stat_metrics.unit}` },
        ];
      },
    },
    annotations: goalDetail ? [{
      type: 'line',
      start: ['min', goalDetail.goal.target_value],
      end: ['max', goalDetail.goal.target_value],
      style: {
        stroke: '#ff4d4f',
        lineDash: [2, 2],
      },
      text: {
        content: 'Target',
        position: 'end',
      },
    }] : [],
    height: 300,
  };

  // Table columns
  const columns = [
    {
      title: 'Game',
      dataIndex: ['live_game_sessions', 'events', 'name'],
      key: 'game',
      width: 150,
    },
    {
      title: 'Date',
      dataIndex: ['live_game_sessions', 'created_at'],
      key: 'date',
      width: 100,
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Opponent',
      dataIndex: ['live_game_sessions', 'events', 'oppositionTeam'],
      key: 'opponent',
      width: 120,
    },
    {
      title: 'Actual',
      dataIndex: 'actual_value',
      key: 'actual',
      width: 80,
      render: (value: number) => value.toFixed(1),
    },
    {
      title: 'Target',
      dataIndex: 'target_value',
      key: 'target',
      width: 80,
      render: (value: number) => value.toFixed(1),
    },
    {
      title: 'Delta',
      dataIndex: 'delta',
      key: 'delta',
      width: 80,
      render: (delta: number) => (
        <span style={{ color: delta >= 0 ? '#52c41a' : '#f5222d' }}>
          {delta >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
          {Math.abs(delta).toFixed(1)}
        </span>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>
          {status.replace('_', ' ').toUpperCase()}
        </Tag>
      ),
    },
  ];

  if (!goalDetail && !loading) {
    return null;
  }

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>{goalDetail?.goal.stat_metrics.name || 'Goal Details'}</span>
          <Tag color="blue">{goalDetail?.goal.stat_metrics.category}</Tag>
        </div>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width={1000}
      destroyOnHidden
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>Loading goal details...</div>
        </div>
      ) : error ? (
        <Alert
          message="Error Loading Goal Details"
          description={error}
          type="error"
          showIcon
          action={
            <Button size="small" onClick={handleRefresh}>
              Retry
            </Button>
          }
        />
      ) : goalDetail ? (
        <div>
          {/* Goal Summary */}
          <Card size="small" style={{ marginBottom: 16 }}>
            <Row gutter={16}>
              <Col span={8}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#666', fontSize: '14px', marginBottom: '4px' }}>Target</div>
                  <div style={{ fontSize: '16px', fontWeight: 600 }}>
                    {getOperatorSymbol(goalDetail.goal.comparison_operator)} {goalDetail.goal.target_value} {goalDetail.goal.stat_metrics.unit}
                  </div>
                </div>
              </Col>
              <Col span={8}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#666', fontSize: '14px', marginBottom: '4px' }}>Period</div>
                  <div style={{ fontSize: '16px', fontWeight: 600 }}>
                    {getPeriodText(goalDetail.goal.period_type)}
                  </div>
                </div>
              </Col>
              <Col span={8}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#666', fontSize: '14px', marginBottom: '4px' }}>Visibility</div>
                  <div style={{ fontSize: '16px', fontWeight: 600 }}>
                    {goalDetail.goal.visibility.replace('_', ' ')}
                  </div>
                </div>
              </Col>
            </Row>
            
            {goalDetail.goal.notes && (
              <div style={{ marginTop: 16, padding: 12, background: '#f5f5f5', borderRadius: 6 }}>
                <strong>Notes:</strong> {goalDetail.goal.notes}
              </div>
            )}
          </Card>

          {/* Actions */}
          <div style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
            <Button icon={<EditOutlined />} onClick={handleEdit}>
              Edit Goal
            </Button>
            <Button icon={<DownloadOutlined />} onClick={handleExport}>
              Export Data
            </Button>
            <Button icon={<ReloadOutlined />} onClick={handleRefresh}>
              Refresh
            </Button>
          </div>

          {/* Trend Chart */}
          {chartData.length > 0 && (
            <Card title="Performance Trend" size="small" style={{ marginBottom: 16 }}>
              {LineChart ? (
                <LineChart {...chartConfig} />
              ) : (
                <div style={{ 
                  height: 300, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  background: '#f5f5f5',
                  borderRadius: 6,
                  color: '#666'
                }}>
                  Loading chart...
                </div>
              )}
            </Card>
          )}

          {/* Progress Table */}
          <Card title="Game-by-Game Progress" size="small">
            <Table
              columns={columns}
              dataSource={goalDetail.progress}
              rowKey="id"
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => 
                  `${range[0]}-${range[1]} of ${total} games`,
              }}
              scroll={{ x: 600 }}
            />
          </Card>
        </div>
      ) : null}
    </Modal>
  );
};

export default GoalDetailModal;
