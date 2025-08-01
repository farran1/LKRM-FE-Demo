import React from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

const data = [
  { name: '2PT', value: 34 },
  { name: '3PT', value: 18 },
  { name: 'FT', value: 12 },
];
const COLORS = ['#1890ff', '#faad14', '#52c41a'];

interface ShotSelectionPanelProps {
  filters?: { timeframe: string; events: string; players: string };
}

const ShotSelectionPanel: React.FC<ShotSelectionPanelProps> = ({ filters }) => {
  let filteredData = data;
  if (filters) {
    if (filters.events === 'Practices') {
      filteredData = data.filter(d => d.name !== '3PT');
    }
  }
  return (
    <div style={{ height: 220, background: '#22304a', borderRadius: 8, padding: 8 }}>
      {filters && (
        <div style={{ color: '#bfc9d1', fontSize: 12, marginBottom: 4 }}>
          Filters: {filters.timeframe} | {filters.events} | {filters.players}
        </div>
      )}
      <div style={{ color: '#fff', fontWeight: 600, marginBottom: 8 }}>Shot Selection</div>
      <ResponsiveContainer width="100%" height="80%">
        <PieChart>
          <Pie data={filteredData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} fill="#8884d8" label>
            {filteredData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip contentStyle={{ background: '#23272f', border: 'none', color: '#fff' }} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export default ShotSelectionPanel; 