'use client';

import React, { useState, useEffect } from 'react';
import { 
  Modal, 
  Form, 
  Select, 
  InputNumber, 
  Radio, 
  Input, 
  Switch, 
  message,
  Spin,
  Alert
} from 'antd';
import { supabase } from '@/lib/supabase';

interface Metric {
  id: number;
  name: string;
  category: string;
  description: string;
  unit: string;
  calculation_type: string;
  event_types: string[];
}

interface GoalFormModalProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  season: string;
  goalId?: number | null;
  mode?: 'create' | 'edit';
}

const GoalFormModal: React.FC<GoalFormModalProps> = ({
  open,
  onClose,
  onSave,
  season,
  goalId,
  mode = 'create'
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<Metric | null>(null);
  const [fetchingMetrics, setFetchingMetrics] = useState(false);

  // Fetch metrics when modal opens
  useEffect(() => {
    if (open) {
      fetchMetrics();
      if (mode === 'edit' && goalId) {
        fetchGoalDetails();
      }
    }
  }, [open, mode, goalId]);

  const fetchMetrics = async () => {
    try {
      setFetchingMetrics(true);
      
      // Get authentication token for API calls
      const { data: { session } } = await supabase.auth.getSession()
      const authHeaders: HeadersInit = session?.access_token ? {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      } : {
        'Content-Type': 'application/json'
      }
      
      const response = await fetch('/api/stats/metrics', {
        headers: authHeaders
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch metrics');
      }
      
      const data = await response.json();
      setMetrics(data.metrics || []);
    } catch (error) {
      console.error('Error fetching metrics:', error);
      message.error('Failed to load metrics');
    } finally {
      setFetchingMetrics(false);
    }
  };

  const fetchGoalDetails = async () => {
    if (!goalId) return;
    
    try {
      setLoading(true);
      
      // Get authentication token for API calls
      const { data: { session } } = await supabase.auth.getSession()
      const authHeaders: HeadersInit = session?.access_token ? {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      } : {
        'Content-Type': 'application/json'
      }
      
      const response = await fetch(`/api/stats/team-goals/${goalId}`, {
        headers: authHeaders
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch goal details');
      }
      
      const data = await response.json();
      const goal = data.goal;
      
      if (goal) {
        form.setFieldsValue({
          metric_id: goal.metric_id,
          target_value: goal.target_value,
          comparison_operator: goal.comparison_operator,
          period_type: goal.period_type,
          season: goal.season
        });
        
        // Set selected metric for description display
        const metric = metrics.find(m => m.id === goal.metric_id);
        if (metric) {
          setSelectedMetric(metric);
        }
      }
    } catch (error) {
      console.error('Error fetching goal details:', error);
      message.error('Failed to load goal details');
    } finally {
      setLoading(false);
    }
  };

  const handleMetricChange = (metricId: number) => {
    const metric = metrics.find(m => m.id === metricId);
    setSelectedMetric(metric || null);
  };

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);
      
      const url = mode === 'edit' && goalId 
        ? `/api/stats/team-goals/${goalId}` 
        : '/api/stats/team-goals';
      
      const method = mode === 'edit' ? 'PUT' : 'POST';
      
      // Get authentication token for API calls
      const { data: { session } } = await supabase.auth.getSession()
      const authHeaders: HeadersInit = session?.access_token ? {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      } : {
        'Content-Type': 'application/json'
      }
      
      const response = await fetch(url, {
        method,
        headers: authHeaders,
        body: JSON.stringify({
          ...values,
          season: season,
          period_type: 'per_game' // Always per game as requested
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save goal');
      }
      
      message.success(`Goal ${mode === 'edit' ? 'updated' : 'created'} successfully`);
      onSave();
    } catch (error) {
      console.error('Error saving goal:', error);
      message.error(error instanceof Error ? error.message : 'Failed to save goal');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setSelectedMetric(null);
    onClose();
  };

  // Group metrics by category
  const metricsByCategory = metrics.reduce((acc, metric) => {
    if (!acc[metric.category]) {
      acc[metric.category] = [];
    }
    acc[metric.category].push(metric);
    return acc;
  }, {} as Record<string, Metric[]>);

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {mode === 'edit' ? 'Edit Goal' : 'Create New Goal'}
        </div>
      }
      open={open}
      onCancel={handleCancel}
      footer={null}
      width={600}
      destroyOnHidden
    >
      {fetchingMetrics ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>Loading metrics...</div>
        </div>
      ) : (
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            season: season,
            comparison_operator: 'lte',
            period_type: 'per_game'
          }}
        >
          {/* Metric Selection */}
          <Form.Item
            label="Metric"
            name="metric_id"
            rules={[{ required: true, message: 'Please select a metric' }]}
          >
            <Select
              placeholder="Select a metric to track"
              onChange={handleMetricChange}
              loading={fetchingMetrics}
            >
              {Object.entries(metricsByCategory).map(([category, categoryMetrics]) => (
                <Select.OptGroup key={category} label={category.charAt(0).toUpperCase() + category.slice(1)}>
                  {categoryMetrics.map((metric) => (
                    <Select.Option key={metric.id} value={metric.id}>
                      {metric.name}
                    </Select.Option>
                  ))}
                </Select.OptGroup>
              ))}
            </Select>
          </Form.Item>


          {/* Target Value and Operator */}
          <Form.Item
            label="Target"
            rules={[{ required: true, message: 'Please set a target value' }]}
          >
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <Form.Item
                name="comparison_operator"
                noStyle
                rules={[{ required: true }]}
              >
                <Select style={{ width: 80 }}>
                  <Select.Option value="lte">≤</Select.Option>
                  <Select.Option value="gte">≥</Select.Option>
                  <Select.Option value="eq">=</Select.Option>
                </Select>
              </Form.Item>
              
              <Form.Item
                name="target_value"
                noStyle
                rules={[{ required: true, message: 'Target value is required' }]}
              >
                <InputNumber
                  placeholder="Value"
                  style={{ flex: 1 }}
                  min={0}
                  step={0.1}
                  precision={1}
                />
              </Form.Item>
              
              <span style={{ color: '#666' }}>
                {selectedMetric?.unit || 'units'}
              </span>
            </div>
          </Form.Item>


          {/* Form Actions */}
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={handleCancel}
                style={{
                  padding: '4px 15px',
                  border: '1px solid #d9d9d9',
                  borderRadius: '6px',
                  background: 'white',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: '4px 15px',
                  border: 'none',
                  borderRadius: '6px',
                  background: '#1890ff',
                  color: 'white',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.6 : 1
                }}
              >
                {loading ? 'Saving...' : (mode === 'edit' ? 'Update Goal' : 'Create Goal')}
              </button>
            </div>
          </Form.Item>
        </Form>
      )}
    </Modal>
  );
};

export default GoalFormModal;
