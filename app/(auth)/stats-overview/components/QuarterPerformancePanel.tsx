import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const data = [
  { qtr: 'Q1', pts: 18 },
  { qtr: 'Q2', pts: 22 },
  { qtr: 'Q3', pts: 16 },
  { qtr: 'Q4', pts: 21 },
];

interface QuarterPerformancePanelProps {
  filters?: { timeframe: string; events: string; players: string };
}

const QuarterPerformancePanel: React.FC<QuarterPerformancePanelProps> = ({ filters }) => {
  let filteredData = data;
  if (filters) {
    if (filters.timeframe === 'Last 7 Days') {
      filteredData = data.filter(d => d.qtr === 'Q1' || d.qtr === 'Q2');
    } else if (filters.timeframe === 'Custom') {
      filteredData = data.filter(d => d.qtr === 'Q3' || d.qtr === 'Q4');
    }
  }
  return (
    <div style={{ height: 220, background: '#22304a', borderRadius: 8, padding: 8 }}>
      {filters && (
        <div style={{ color: '#bfc9d1', fontSize: 12, marginBottom: 4 }}>
          Filters: {filters.timeframe} | {filters.events} | {filters.players}
        </div>
      )}
      <div style={{ color: '#fff', fontWeight: 600, marginBottom: 8 }}>Quarter Performance</div>
      <ResponsiveContainer width="100%" height="80%">
        <BarChart data={filteredData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a3b4d" />
          <XAxis dataKey="qtr" stroke="#bfc9d1" fontSize={12} />
          <YAxis stroke="#bfc9d1" fontSize={12} />
          <Tooltip contentStyle={{ background: '#23272f', border: 'none', color: '#fff' }} />
          <Bar dataKey="pts" fill="#1890ff" barSize={32} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default QuarterPerformancePanel; 