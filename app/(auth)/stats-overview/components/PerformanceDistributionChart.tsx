import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const data = [
  { range: '50-59', count: 2 },
  { range: '60-69', count: 5 },
  { range: '70-79', count: 6 },
  { range: '80-89', count: 3 },
];

interface PerformanceDistributionChartProps {
  filters?: { timeframe: string; events: string; players: string };
}

const PerformanceDistributionChart: React.FC<PerformanceDistributionChartProps> = ({ filters }) => {
  let filteredData = data;
  if (filters) {
    if (filters.timeframe === 'Last 7 Days') {
      filteredData = data.slice(-2);
    } else if (filters.timeframe === 'Custom') {
      filteredData = data.slice(0, 2);
    }
  }
  return (
    <div style={{ height: 220, background: '#22304a', borderRadius: 8, padding: 8 }}>
      {filters && (
        <div style={{ color: '#bfc9d1', fontSize: 12, marginBottom: 4 }}>
          Filters: {filters.timeframe} | {filters.events} | {filters.players}
        </div>
      )}
      <div style={{ color: '#fff', fontWeight: 600, marginBottom: 8 }}>Performance Distribution</div>
      <ResponsiveContainer width="100%" height="80%">
        <BarChart data={filteredData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a3b4d" />
          <XAxis dataKey="range" stroke="#bfc9d1" fontSize={12} />
          <YAxis stroke="#bfc9d1" fontSize={12} />
          <Tooltip contentStyle={{ background: '#23272f', border: 'none', color: '#fff' }} />
          <Bar dataKey="count" fill="#722ed1" barSize={32} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default PerformanceDistributionChart; 