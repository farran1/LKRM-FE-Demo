import React from "react";
import { Card, Statistic, Tag } from "antd";

interface TeamRecord {
  wins: number;
  losses: number;
  streak: string;
}

interface TeamRecordCardProps {
  record?: TeamRecord;
  standing?: any;
  nextOpponent?: any;
  overflowClass?: string;
}

export default function TeamRecordCard({ record = { wins: 0, losses: 0, streak: '0' }, standing = null, nextOpponent = null, overflowClass = '' }: TeamRecordCardProps) {
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