import React from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

const data = [
  { name: 'Home', value: 12 },
  { name: 'Away', value: 8 },
  { name: 'Neutral', value: 3 },
];
const COLORS = ['#1890ff', '#faad14', '#ff4d4f'];

const SituationalBreakdownChart: React.FC = () => (
  <div style={{ height: 220, background: '#22304a', borderRadius: 8, padding: 8 }}>
    <div style={{ color: '#fff', fontWeight: 600, marginBottom: 8 }}>Situational Breakdown</div>
    <ResponsiveContainer width="100%" height="80%">
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} fill="#8884d8" label>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip contentStyle={{ background: '#23272f', border: 'none', color: '#fff' }} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  </div>
);

export default SituationalBreakdownChart; 