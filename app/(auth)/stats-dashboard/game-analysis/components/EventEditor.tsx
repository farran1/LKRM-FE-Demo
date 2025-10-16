import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Select, InputNumber, Switch, Button, App, Space, Divider } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import api from '@/services/api';

interface EventEditorProps {
  event: any;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedEvent: any) => void;
  onDelete: (eventId: string) => void;
  players: any[];
  isPostGame?: boolean;
}

const EventEditor: React.FC<EventEditorProps> = ({
  event,
  isOpen,
  onClose,
  onSave,
  onDelete,
  players,
  isPostGame = false
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const { message } = App.useApp();

  useEffect(() => {
    if (event && isOpen) {
      form.setFieldsValue({
        player_id: event.player_id,
        event_type: event.event_type,
        event_value: event.event_value,
        quarter: event.quarter,
        is_opponent_event: event.is_opponent_event,
        opponent_jersey: event.opponent_jersey,
        metadata: event.metadata || {}
      });
      setIsEditing(!!event.id);
    }
  }, [event, isOpen, form]);

  const handleSave = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();
      
      // Auto-calculate event_value based on event_type
      const eventValueMap: { [key: string]: number } = {
        'fg_made': 2,
        'fg_missed': 0,
        'three_made': 3,
        'three_missed': 0,
        'ft_made': 1,
        'ft_missed': 0,
        'reb': 1,
        'as': 1,
        'st': 1,
        'blk': 1,
        'to': 1,
        'f': 1
      };
      
      const eventValue = eventValueMap[values.event_type] || 0;
      
      if (isEditing) {
        // Update existing event
        const eventData = {
          ...values,
          event_value: eventValue
        };
        const response = await api.put(`/api/live-game-events/${event.id}`, eventData);
        onSave((response.data as any).event);
        message.success('Event updated successfully');
      } else {
        // Create new event
        const eventData = {
          ...values,
          event_value: eventValue,
          session_id: event.session_id
        };
        const response = await api.post('/api/live-game-events', eventData);
        onSave((response.data as any).event);
        message.success('Event created successfully');
      }
      
      onClose();
    } catch (error: any) {
      console.error('🎯 EventEditor - Error saving event:', error);
      message.error(error.response?.data?.error || 'Failed to save event');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!event.id) return;
    
    Modal.confirm({
      title: 'Delete Event',
      content: 'Are you sure you want to delete this event? This action cannot be undone.',
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          setLoading(true);
          const response = await api.delete(`/api/live-game-events/${event.id}`);
          onDelete(event.id);
          message.success('Event deleted successfully');
          onClose();
        } catch (error: any) {
          console.error('Error deleting event:', error);
          message.error(error.response?.data?.error || 'Failed to delete event');
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const eventTypes = [
    { value: 'fg_made', label: 'Field Goal Made' },
    { value: 'fg_missed', label: 'Field Goal Missed' },
    { value: 'three_made', label: 'Three Point Made' },
    { value: 'three_missed', label: 'Three Point Missed' },
    { value: 'ft_made', label: 'Free Throw Made' },
    { value: 'ft_missed', label: 'Free Throw Missed' },
    { value: 'rebound', label: 'Rebound' },
    { value: 'assist', label: 'Assist' },
    { value: 'steal', label: 'Steal' },
    { value: 'block', label: 'Block' },
    { value: 'turnover', label: 'Turnover' },
    { value: 'foul', label: 'Foul' },
    { value: 'points', label: 'Points' }
  ];

  const quarters = [
    { value: 1, label: '1st Quarter' },
    { value: 2, label: '2nd Quarter' },
    { value: 3, label: '3rd Quarter' },
    { value: 4, label: '4th Quarter' },
    { value: 5, label: 'Overtime' }
  ];

  return (
    <Modal
      title={isEditing ? 'Edit Event' : 'Add Event'}
      open={isOpen}
      onCancel={onClose}
      width={600}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        isEditing && (
          <Button key="delete" danger onClick={handleDelete} loading={loading}>
            <DeleteOutlined /> Delete
          </Button>
        ),
        <Button key="save" type="primary" onClick={handleSave} loading={loading}>
          <EditOutlined /> {isEditing ? 'Update' : 'Create'}
        </Button>
      ]}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          quarter: 1,
          is_opponent_event: false
        }}
      >
        <Form.Item
          label="Player"
          dependencies={['is_opponent_event']}
          rules={[
            ({ getFieldValue }) => ({
              validator(_, value) {
                const isOpponentEvent = getFieldValue('is_opponent_event');
                if (!isOpponentEvent && !value) {
                  return Promise.reject(new Error('Please select a player'));
                }
                return Promise.resolve();
              },
            }),
          ]}
        >
          {({ getFieldValue }) => {
            const isOpponentEvent = getFieldValue('is_opponent_event');
            if (isOpponentEvent) {
              return null;
            }
            return (
              <Form.Item name="player_id" noStyle>
                <Select
                  placeholder="Select player"
                  showSearch
                  optionFilterProp="children"
                  filterOption={(input, option) =>
                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                  }
                  options={players.map(player => ({
                    value: player.id,
                    label: `${player.first_name} ${player.last_name}`
                  }))}
                />
              </Form.Item>
            );
          }}
        </Form.Item>

        <Form.Item
          name="event_type"
          label="Event Type"
          rules={[{ required: true, message: 'Please select event type' }]}
        >
          <Select placeholder="Select event type" options={eventTypes} />
        </Form.Item>

        <Form.Item
          name="quarter"
          label="Quarter"
          rules={[{ required: true, message: 'Please select quarter' }]}
        >
          <Select placeholder="Select quarter" options={quarters} />
        </Form.Item>

        <Form.Item
          name="is_opponent_event"
          label="Opponent Event"
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>

        <Form.Item
          label="Opponent Jersey"
          dependencies={['is_opponent_event']}
        >
          {({ getFieldValue }) =>
            getFieldValue('is_opponent_event') ? (
              <Form.Item name="opponent_jersey" noStyle>
                <Input placeholder="Enter opponent jersey number" />
              </Form.Item>
            ) : null
          }
        </Form.Item>

      </Form>
    </Modal>
  );
};

export default EventEditor;
