import React from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const data = [
  { min: 0, lead: 0 },
  { min: 4, lead: 2 },
  { min: 8, lead: 5 },
  { min: 12, lead: 3 },
  { min: 16, lead: -1 },
  { min: 20, lead: -4 },
  { min: 24, lead: 1 },
  { min: 28, lead: 6 },
  { min: 32, lead: 8 },
  { min: 36, lead: 4 },
  { min: 40, lead: 7 },
];

const GameFlowChart: React.FC = () => (
  <div style={{ height: 220, background: '#22304a', borderRadius: 8, padding: 8 }}>
    <div style={{ color: '#fff', fontWeight: 600, marginBottom: 8 }}>Game Flow Chart</div>
    <ResponsiveContainer width="100%" height="80%">
      <LineChart data={data} margin={{ top: 16, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#2a3b4d" />
        <XAxis dataKey="min" stroke="#bfc9d1" fontSize={12} label={{ value: 'Minutes', position: 'insideBottom', fill: '#bfc9d1', fontSize: 12 }} />
        <YAxis stroke="#bfc9d1" fontSize={12} label={{ value: 'Lead', angle: -90, position: 'insideLeft', fill: '#bfc9d1', fontSize: 12 }} />
        <Tooltip contentStyle={{ background: '#23272f', border: 'none', color: '#fff' }} />
        <Line type="monotone" dataKey="lead" stroke="#faad14" strokeWidth={3} dot={{ r: 4 }} />
      </LineChart>
    </ResponsiveContainer>
  </div>
);

export default GameFlowChart; 