import React from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const data = [
  { game: 'G1', ppg: 68, oppg: 62 },
  { game: 'G2', ppg: 72, oppg: 65 },
  { game: 'G3', ppg: 65, oppg: 70 },
  { game: 'G4', ppg: 80, oppg: 75 },
  { game: 'G5', ppg: 74, oppg: 68 },
  { game: 'G6', ppg: 69, oppg: 66 },
  { game: 'G7', ppg: 77, oppg: 70 },
  { game: 'G8', ppg: 81, oppg: 77 },
  { game: 'G9', ppg: 73, oppg: 62 },
  { game: 'G10', ppg: 79, oppg: 73 },
];

interface TeamTrendLinesProps {
  filters?: { timeframe: string; events: string; players: string };
}

const TeamTrendLines: React.FC<TeamTrendLinesProps> = ({ filters }) => {
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
      <div style={{ color: '#fff', fontWeight: 600, marginBottom: 8 }}>Team Trend Lines</div>
      <ResponsiveContainer width="100%" height="80%">
        <LineChart data={filteredData} margin={{ top: 16, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a3b4d" />
          <XAxis dataKey="game" stroke="#bfc9d1" fontSize={12} />
          <YAxis stroke="#bfc9d1" fontSize={12} />
          <Tooltip contentStyle={{ background: '#23272f', border: 'none', color: '#fff' }} />
          <Legend />
          <Line type="monotone" dataKey="ppg" stroke="#4be04b" strokeWidth={3} dot={{ r: 4 }} name="PPG" />
          <Line type="monotone" dataKey="oppg" stroke="#faad14" strokeWidth={3} dot={{ r: 4 }} name="OPPG" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default TeamTrendLines; 