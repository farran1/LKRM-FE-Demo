import React from "react";
import { Card, List, Tag } from "antd";

export default function RecentResultsCard({ results = [], overflowClass = '' }) {
  return (
    <Card
      style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
      styles={{ body: { flex: 1, display: 'flex', flexDirection: 'column' } }}
      title={<span style={{ color: '#fff', fontWeight: 700 }}>Recent Results</span>}
      bordered={false}
    >
      <div className={overflowClass}>
        <List
          dataSource={results}
          locale={{ emptyText: "No recent games" }}
          renderItem={item => (
            <List.Item style={{ color: '#fff', border: 'none' }}>
              <Tag color={item.result === 'W' ? 'green' : 'red'}>{item.result}</Tag>
              <span style={{ marginLeft: 8 }}>{item.score}</span>
              <span style={{ marginLeft: 8 }}>{item.opponent}</span>
              <span style={{ marginLeft: 8, color: '#b0c4d4' }}>{item.date}</span>
            </List.Item>
          )}
        />
      </div>
    </Card>
  );
} 