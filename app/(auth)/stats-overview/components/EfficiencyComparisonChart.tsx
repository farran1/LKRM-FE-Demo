import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const data = [
  { team: 'Wildcats', eff: 1.12 },
  { team: 'Eagles', eff: 1.08 },
  { team: 'Bears', eff: 1.05 },
  { team: 'Lions', eff: 1.01 },
  { team: 'Tigers', eff: 0.98 },
];

interface EfficiencyComparisonChartProps {
  filters?: { timeframe: string; events: string; players: string };
}

const EfficiencyComparisonChart: React.FC<EfficiencyComparisonChartProps> = ({ filters }) => {
  let filteredData = data;
  if (filters) {
    if (filters.players === 'Starters') {
      filteredData = data.slice(0, 3);
    } else if (filters.players === 'Bench') {
      filteredData = data.slice(-2);
    }
  }
  return (
    <div style={{ height: 220, background: '#22304a', borderRadius: 8, padding: 8 }}>
      {filters && (
        <div style={{ color: '#bfc9d1', fontSize: 12, marginBottom: 4 }}>
          Filters: {filters.timeframe} | {filters.events} | {filters.players}
        </div>
      )}
      <div style={{ color: '#fff', fontWeight: 600, marginBottom: 8 }}>Efficiency Comparison</div>
      <ResponsiveContainer width="100%" height="80%">
        <BarChart data={filteredData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a3b4d" />
          <XAxis dataKey="team" stroke="#bfc9d1" fontSize={12} />
          <YAxis stroke="#bfc9d1" fontSize={12} />
          <Tooltip contentStyle={{ background: '#23272f', border: 'none', color: '#fff' }} />
          <Bar dataKey="eff" fill="#faad14" barSize={32} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default EfficiencyComparisonChart; 