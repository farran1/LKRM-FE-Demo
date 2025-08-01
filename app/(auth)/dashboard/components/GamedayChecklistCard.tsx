import React from "react";
import { Card, Progress, List, Button } from "antd";

// Mock data for the gameday checklist
const checklistData = {
  game: "Game vs. Eagles",
  completedTasks: 12,
  totalTasks: 20,
  pending: 2,
  items: [
    {
      title: "Set Up Locker Room",
      description: "Ensure jerseys, gear, and hydration are ready before the team arrives.",
      status: "done",
    },
    {
      title: "Sync With Coaching Staff",
      description: "Review final game plan and key matchups before kickoff.",
      status: "pending",
    },
  ],
};

export default function GamedayChecklistCard({ overflowClass = '' }) {
  const percent = Math.round((checklistData.completedTasks / checklistData.totalTasks) * 100);

  return (
    <Card
      style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
      styles={{ body: { flex: 1, display: 'flex', flexDirection: 'column' } }}
      title={
        <span style={{ color: "#efff5d", fontWeight: 700, fontSize: 20 }}>
          Today’s Game Checklist
        </span>
      }
      extra={<a href="#" style={{ color: "#fff" }}>View all</a>}
    >
      <div className={overflowClass}>
        <div style={{ color: "#fff", marginBottom: 12 }}>
          Game vs. Eagles
        </div>
        <div style={{ color: "#b0c4d4", fontSize: 13, marginBottom: 8 }}>
          Completed Tasks
          <span style={{ float: "right" }}>{checklistData.completedTasks}</span>
        </div>
        <Progress percent={Math.round((checklistData.completedTasks / checklistData.totalTasks) * 100)} showInfo={false} strokeColor="#efff5d" style={{ marginBottom: 8 }} />
        <div style={{ color: "#b0c4d4", fontSize: 13, marginBottom: 8 }}>
          Total Tasks
          <span style={{ float: "right" }}>{checklistData.totalTasks}</span>
        </div>
        <List
          dataSource={checklistData.items}
          renderItem={item => (
            <List.Item style={{ color: "#fff", border: "none", background: "#17375c", borderRadius: 8, marginBottom: 8 }}>
              <div style={{ width: "100%" }}>
                <div style={{ fontWeight: 600 }}>{item.title}</div>
                <div style={{ fontSize: 13 }}>{item.description}</div>
              </div>
              <div style={{ marginLeft: 16, color: item.status === "done" ? "#52c41a" : "#efff5d", fontWeight: 600 }}>
                {item.status === "done" ? "Done" : "Pending"}
              </div>
            </List.Item>
          )}
        />
      </div>
    </Card>
  );
} 