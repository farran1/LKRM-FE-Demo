import React from "react";
import { Card, List, Tag } from "antd";

interface Task {
  name: string;
  dueDate: string;
  status: 'overdue' | 'pending' | 'completed';
}

interface TasksCardProps {
  tasks?: Task[];
  overflowClass?: string;
}

export default function TasksCard({ tasks = [], overflowClass = '' }: TasksCardProps) {
  return (
    <Card
      style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
      styles={{ body: { flex: 1, display: 'flex', flexDirection: 'column' } }}
      title={<span style={{ color: '#fff', fontWeight: 700 }}>Tasks</span>}
      bordered={false}
    >
      <div className={overflowClass}>
      <List
        dataSource={tasks}
          renderItem={item => (
            <List.Item style={{ color: '#fff', border: 'none' }}>
            <div>
                <div style={{ fontWeight: 600 }}>{item.name}</div>
                <div style={{ fontSize: 13 }}>{item.dueDate}</div>
                <Tag color={item.status === 'overdue' ? 'red' : 'gold'}>{item.status}</Tag>
            </div>
          </List.Item>
        )}
      />
      </div>
    </Card>
  );
} 