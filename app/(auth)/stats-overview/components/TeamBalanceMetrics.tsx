import React from "react";

const metrics = [
  { label: 'Offense', value: 87, color: '#4be04b' },
  { label: 'Defense', value: 82, color: '#1890ff' },
  { label: 'Rebounding', value: 78, color: '#faad14' },
  { label: 'Passing', value: 91, color: '#722ed1' },
];

const TeamBalanceMetrics: React.FC = () => (
  <div style={{ height: 220, background: '#22304a', borderRadius: 8, padding: 8, color: '#fff' }}>
    <div style={{ color: '#fff', fontWeight: 600, marginBottom: 8 }}>Team Balance Metrics</div>
    <div style={{ display: 'flex', gap: 16, justifyContent: 'center', alignItems: 'center', height: '80%' }}>
      {metrics.map((m, i) => (
        <div key={i} style={{ background: '#23272f', borderRadius: 8, padding: '16px 20px', minWidth: 90, textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.12)' }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: m.color }}>{m.value}</div>
          <div style={{ fontSize: 14, color: '#bfc9d1', marginTop: 4 }}>{m.label}</div>
        </div>
      ))}
    </div>
  </div>
);

export default TeamBalanceMetrics; 