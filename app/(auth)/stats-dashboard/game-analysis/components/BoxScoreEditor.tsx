/*
import React, { useState, useEffect } from 'react';
import { Modal, Form, InputNumber, Button, message, Table, Space, Divider, Typography, Input } from 'antd';
import { EditOutlined, SaveOutlined } from '@ant-design/icons';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

const { Title } = Typography;

interface BoxScoreEditorProps {
  gameId: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedGame: any) => void;
  gameData: any;
}

const BoxScoreEditor: React.FC<BoxScoreEditorProps> = ({
  gameId,
  isOpen,
  onClose,
  onSave,
  gameData
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<string | null>(null);
  const [playerStats, setPlayerStats] = useState<any[]>([]);

  useEffect(() => {
    if (gameData && isOpen) {
      // Parse the score string (e.g., "85-72") to get home and away scores
      const scoreParts = gameData.score ? gameData.score.split('-') : ['0', '0'];
      const homeScore = parseInt(scoreParts[0]) || 0;
      const awayScore = parseInt(scoreParts[1]) || 0;
      
      form.setFieldsValue({
        home_score: homeScore,
        away_score: awayScore,
        result: gameData.result || 'WIN'
      });
      
      // Set player stats from game data
      if (gameData.playerStats) {
        setPlayerStats(gameData.playerStats);
      }
    }
  }, [gameData, isOpen, form]);

  const handleGameSave = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();
      
      // Get the current session for authentication
      const supabase = createClientComponentClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
      
      // If actualGameId is null, we need to create a game record first
      let gameIdToUse = gameId;
      if (!gameData?.actualGameId) {
        console.log('No game record exists, creating one...');
        
        // Create a new game record
        const createGameResponse = await fetch('/api/games', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            event_id: gameData?.eventId || gameData?.gameId,
            opponent: gameData?.opponent || 'Unknown',
            home_score: values.home_score,
            away_score: values.away_score,
            result: values.result
          }),
        });
        
        if (!createGameResponse.ok) {
          const errorData = await createGameResponse.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to create game record: ${createGameResponse.status}`);
        }
        
        const createResult = await createGameResponse.json();
        gameIdToUse = createResult.game.id;
        
        // Update the live game session to link to the new game record
        const updateSessionResponse = await fetch(`/api/live-game-sessions/${gameId}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify({
            game_id: gameIdToUse
          }),
        });
        
        if (!updateSessionResponse.ok) {
          console.warn('Failed to update session with game_id, but game was created');
        }
      } else {
        gameIdToUse = gameData.actualGameId;
      }
      
      // Now update the game record
      const response = await fetch(`/api/games/${gameIdToUse}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(values),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      onSave(result.game);
      message.success('Game updated successfully');
      onClose();
    } catch (error: any) {
      console.error('Error saving game:', error);
      message.error(error.message || 'Failed to save game');
    } finally {
      setLoading(false);
    }
  };

  const handlePlayerStatEdit = (playerId: string, field: string, value: number) => {
    setPlayerStats(prev => 
      prev.map(player => 
        player.id === playerId 
          ? { ...player, [field]: value }
          : player
      )
    );
  };

  const handlePlayerStatSave = async (playerId: string) => {
    try {
      const player = playerStats.find(p => p.id === playerId);
      if (!player) return;

      // Get the current session for authentication
      const supabase = createClientComponentClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      // Determine the correct game ID to use
      let gameIdToUse = gameData?.actualGameId || gameId;
      
      // If no game record exists, we need to create one first
      if (!gameData?.actualGameId) {
        console.log('No game record exists for player stats, creating one...');
        
        // Create a new game record
        const createGameResponse = await fetch('/api/games', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            event_id: gameData?.eventId || gameData?.gameId,
            opponent: gameData?.opponent || 'Unknown',
            home_score: 0,
            away_score: 0,
            result: 'WIN'
          }),
        });
        
        if (!createGameResponse.ok) {
          const errorData = await createGameResponse.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to create game record: ${createGameResponse.status}`);
        }
        
        const createResult = await createGameResponse.json();
        gameIdToUse = createResult.game.id;
        
        // Update the live game session to link to the new game record
        const updateSessionResponse = await fetch(`/api/live-game-sessions/${gameId}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify({
            game_id: gameIdToUse
          }),
        });
        
        if (!updateSessionResponse.ok) {
          console.warn('Failed to update session with game_id, but game was created');
        }
      }

      // Update the player's stats via the game stats API
      const response = await fetch(`/api/game-stats/${playerId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          game_id: gameIdToUse,
          ...player
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      message.success(`${player.name}'s stats updated successfully`);
      setEditingPlayer(null);
    } catch (error: any) {
      console.error('Error saving player stats:', error);
      message.error(error.message || 'Failed to save player stats');
    }
  };

  const playerColumns = [
    {
      title: 'Player',
      dataIndex: 'name',
      key: 'name',
      width: 150,
      fixed: 'left' as const
    },
    {
      title: 'PTS',
      dataIndex: 'points',
      key: 'points',
      width: 60,
      render: (value: number, record: any) => (
        editingPlayer === record.id ? (
          <InputNumber
            min={0}
            max={100}
            value={value}
            onChange={(val) => handlePlayerStatEdit(record.id, 'points', val || 0)}
            onPressEnter={() => handlePlayerStatSave(record.id)}
            autoFocus
          />
        ) : (
          <span onClick={() => setEditingPlayer(record.id)} style={{ cursor: 'pointer' }}>
            {value}
          </span>
        )
      )
    },
    {
      title: 'REB',
      dataIndex: 'rebounds',
      key: 'rebounds',
      width: 60,
      render: (value: number, record: any) => (
        editingPlayer === record.id ? (
          <InputNumber
            min={0}
            max={50}
            value={value}
            onChange={(val) => handlePlayerStatEdit(record.id, 'rebounds', val || 0)}
            onPressEnter={() => handlePlayerStatSave(record.id)}
          />
        ) : (
          <span onClick={() => setEditingPlayer(record.id)} style={{ cursor: 'pointer' }}>
            {value}
          </span>
        )
      )
    },
    {
      title: 'AST',
      dataIndex: 'assists',
      key: 'assists',
      width: 60,
      render: (value: number, record: any) => (
        editingPlayer === record.id ? (
          <InputNumber
            min={0}
            max={50}
            value={value}
            onChange={(val) => handlePlayerStatEdit(record.id, 'assists', val || 0)}
            onPressEnter={() => handlePlayerStatSave(record.id)}
          />
        ) : (
          <span onClick={() => setEditingPlayer(record.id)} style={{ cursor: 'pointer' }}>
            {value}
          </span>
        )
      )
    },
    {
      title: 'STL',
      dataIndex: 'steals',
      key: 'steals',
      width: 60,
      render: (value: number, record: any) => (
        editingPlayer === record.id ? (
          <InputNumber
            min={0}
            max={20}
            value={value}
            onChange={(val) => handlePlayerStatEdit(record.id, 'steals', val || 0)}
            onPressEnter={() => handlePlayerStatSave(record.id)}
          />
        ) : (
          <span onClick={() => setEditingPlayer(record.id)} style={{ cursor: 'pointer' }}>
            {value}
          </span>
        )
      )
    },
    {
      title: 'BLK',
      dataIndex: 'blocks',
      key: 'blocks',
      width: 60,
      render: (value: number, record: any) => (
        editingPlayer === record.id ? (
          <InputNumber
            min={0}
            max={20}
            value={value}
            onChange={(val) => handlePlayerStatEdit(record.id, 'blocks', val || 0)}
            onPressEnter={() => handlePlayerStatSave(record.id)}
          />
        ) : (
          <span onClick={() => setEditingPlayer(record.id)} style={{ cursor: 'pointer' }}>
            {value}
          </span>
        )
      )
    },
    {
      title: 'TOV',
      dataIndex: 'turnovers',
      key: 'turnovers',
      width: 60,
      render: (value: number, record: any) => (
        editingPlayer === record.id ? (
          <InputNumber
            min={0}
            max={20}
            value={value}
            onChange={(val) => handlePlayerStatEdit(record.id, 'turnovers', val || 0)}
            onPressEnter={() => handlePlayerStatSave(record.id)}
          />
        ) : (
          <span onClick={() => setEditingPlayer(record.id)} style={{ cursor: 'pointer' }}>
            {value}
          </span>
        )
      )
    },
    {
      title: 'FLS',
      dataIndex: 'fouls',
      key: 'fouls',
      width: 60,
      render: (value: number, record: any) => (
        editingPlayer === record.id ? (
          <InputNumber
            min={0}
            max={6}
            value={value}
            onChange={(val) => handlePlayerStatEdit(record.id, 'fouls', val || 0)}
            onPressEnter={() => handlePlayerStatSave(record.id)}
          />
        ) : (
          <span onClick={() => setEditingPlayer(record.id)} style={{ cursor: 'pointer' }}>
            {value}
          </span>
        )
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      render: (_, record: any) => (
        <Space>
          {editingPlayer === record.id ? (
            <Button
              type="primary"
              size="small"
              icon={<SaveOutlined />}
              onClick={() => handlePlayerStatSave(record.id)}
            >
              Save
            </Button>
          ) : (
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={() => setEditingPlayer(record.id)}
            >
              Edit
            </Button>
          )}
        </Space>
      )
    }
  ];

  return (
    <Modal
      title="Edit Box Score"
      open={isOpen}
      onCancel={onClose}
      width={1000}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Button key="save" type="primary" onClick={handleGameSave} loading={loading}>
          <SaveOutlined /> Save Game
        </Button>
      ]}
    >
      <Form
        form={form}
        layout="vertical"
      >
        <Title level={4}>Game Score</Title>
        <Space size="large">
          <Form.Item
            name="home_score"
            label="Home Score"
            rules={[{ required: true, message: 'Please enter home score' }]}
          >
            <InputNumber min={0} max={200} />
          </Form.Item>
          
          <Form.Item
            name="away_score"
            label="Away Score"
            rules={[{ required: true, message: 'Please enter away score' }]}
          >
            <InputNumber min={0} max={200} />
          </Form.Item>
        </Space>

        <Divider />

        <Title level={4}>Player Statistics</Title>
        <Table
          columns={playerColumns}
          dataSource={playerStats}
          rowKey="id"
          pagination={false}
          scroll={{ x: 800 }}
          size="small"
        />
      </Form>
    </Modal>
  );
};

export default BoxScoreEditor;
*/

// BoxScoreEditor component temporarily disabled
export default function BoxScoreEditor() {
  return null;
}
