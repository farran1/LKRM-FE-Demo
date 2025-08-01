import React from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import dayjs from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

const data = [
  { game: 'G1', points: 68 },
  { game: 'G2', points: 72 },
  { game: 'G3', points: 65 },
  { game: 'G4', points: 80 },
  { game: 'G5', points: 74 },
  { game: 'G6', points: 69 },
  { game: 'G7', points: 77 },
  { game: 'G8', points: 81 },
  { game: 'G9', points: 73 },
  { game: 'G10', points: 79 },
];

interface PerformanceTrendLinesProps {
  filters?: { timeframe: string; events: string; players: string };
}

const PerformanceTrendLines: React.FC<PerformanceTrendLinesProps> = ({ filters }) => {
  let filteredData = data;
  if (filters) {
    if (filters.timeframe === 'Last 7 Days') {
      filteredData = data.slice(-5);
    } else if (filters.timeframe === 'Custom') {
      filteredData = data.slice(0, 3);
    }
  }
  return (
    <div style={{ height: 220, background: '#22304a', borderRadius: 8, padding: 8 }}>
      {filters && (
        <div style={{ color: '#bfc9d1', fontSize: 12, marginBottom: 4 }}>
          Filters: {filters.timeframe} | {filters.events} | {filters.players}
        </div>
      )}
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={filteredData} margin={{ top: 16, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a3b4d" />
          <XAxis dataKey="game" stroke="#bfc9d1" fontSize={12} />
          <YAxis stroke="#bfc9d1" fontSize={12} />
          <Tooltip contentStyle={{ background: '#23272f', border: 'none', color: '#fff' }} />
          <Line type="monotone" dataKey="points" stroke="#4be04b" strokeWidth={3} dot={{ r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default PerformanceTrendLines; 