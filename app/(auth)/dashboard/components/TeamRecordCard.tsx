import React from "react";
import { Card, Statistic, Tag } from "antd";

export default function TeamRecordCard({ record = {}, standing = null, nextOpponent = null, overflowClass = '' }) {
  return (
    <Card
      style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
      styles={{ body: { flex: 1, display: 'flex', flexDirection: 'column' } }}
      title={<span style={{ color: '#fff', fontWeight: 700 }}>Team Record</span>}
      bordered={false}
    >
      <div className={overflowClass}>
        <Statistic title="Wins" value={record.wins} valueStyle={{ color: '#52c41a' }} />
        <Statistic title="Losses" value={record.losses} valueStyle={{ color: '#f5222d' }} />
        <div style={{ marginTop: 16, color: '#fff' }}>Streak: <Tag color="blue">{record.streak}</Tag></div>
      </div>
    </Card>
  );
} 