import React from "react";
import { Card, List, Tag } from "antd";

export default function AnnouncementsCard({ announcements = [], overflowClass = '' }) {
  return (
    <Card
      style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
      styles={{ body: { flex: 1, display: 'flex', flexDirection: 'column' } }}
      title={<span style={{ color: '#fff', fontWeight: 700 }}>Announcements</span>}
      bordered={false}
    >
      <div className={overflowClass}>
      <List
        dataSource={announcements}
          renderItem={item => (
            <List.Item style={{ color: '#fff', border: 'none' }}>
            <div>
                <div style={{ fontWeight: 600 }}>{item.title}</div>
                <div style={{ fontSize: 13 }}>{item.message}</div>
                {item.urgent && <Tag color="red">Urgent</Tag>}
            </div>
          </List.Item>
        )}
      />
      </div>
    </Card>
  );
} 