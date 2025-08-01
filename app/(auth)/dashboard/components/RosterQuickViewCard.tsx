import React from "react";
import { Card, List, Tag } from "antd";

export default function RosterQuickViewCard({ players = [], overflowClass = '' }) {
  return (
    <Card
      style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
      styles={{ body: { flex: 1, display: 'flex', flexDirection: 'column' } }}
      title={<span style={{ color: '#fff', fontWeight: 700 }}>Roster Quick View</span>}
      bordered={false}
    >
      <div className={overflowClass}>
        <List
          dataSource={players}
          locale={{ emptyText: "No key players" }}
          renderItem={player => (
            <List.Item style={{ color: '#fff', border: 'none' }}>
              <div>
                <div style={{ fontWeight: 600 }}>{player.name}</div>
                <div style={{ fontSize: 13 }}>{player.position}</div>
                {player.status === 'injured' && <Tag color="red">Injured</Tag>}
                {player.birthday && <Tag color="blue">Birthday</Tag>}
              </div>
            </List.Item>
          )}
        />
      </div>
    </Card>
  );
} 