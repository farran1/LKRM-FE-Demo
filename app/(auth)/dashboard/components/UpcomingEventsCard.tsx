import React from "react";
import BaseDashboardCard from "./BaseDashboardCard";
import { List } from "antd";

export default function UpcomingEventsCard({ events = [], overflow = "scroll" }) {
  return (
    <BaseDashboardCard title={<span style={{ color: '#fff', fontWeight: 700 }}>Upcoming Events</span>} overflow={overflow}>
      <List
        dataSource={events}
        renderItem={item => (
          <List.Item style={{ color: '#fff', border: 'none' }}>
            <div>
              <div style={{ fontWeight: 600 }}>{item.title}</div>
              <div style={{ fontSize: 13 }}>{item.date} @ {item.time}</div>
              <div style={{ fontSize: 13, color: '#b0c4d4' }}>{item.location || item.opponent}</div>
            </div>
          </List.Item>
        )}
      />
    </BaseDashboardCard>
  );
} 