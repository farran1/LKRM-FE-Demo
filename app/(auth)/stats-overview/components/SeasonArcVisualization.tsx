import React from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const data = [
  { game: 1, pts: 68 },
  { game: 2, pts: 72 },
  { game: 3, pts: 65 },
  { game: 4, pts: 80 },
  { game: 5, pts: 74 },
  { game: 6, pts: 69 },
  { game: 7, pts: 77 },
  { game: 8, pts: 81 },
  { game: 9, pts: 73 },
  { game: 10, pts: 79 },
  { game: 11, pts: 75 },
  { game: 12, pts: 70 },
];

const SeasonArcVisualization: React.FC = () => (
  <div style={{ height: 220, background: '#22304a', borderRadius: 8, padding: 8 }}>
    <div style={{ color: '#fff', fontWeight: 600, marginBottom: 8 }}>Season Arc Visualization</div>
    <ResponsiveContainer width="100%" height="80%">
      <LineChart data={data} margin={{ top: 16, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#2a3b4d" />
        <XAxis dataKey="game" stroke="#bfc9d1" fontSize={12} label={{ value: 'Game', position: 'insideBottom', fill: '#bfc9d1', fontSize: 12 }} />
        <YAxis stroke="#bfc9d1" fontSize={12} />
        <Tooltip contentStyle={{ background: '#23272f', border: 'none', color: '#fff' }} />
        <Line type="monotone" dataKey="pts" stroke="#722ed1" strokeWidth={3} dot={{ r: 4 }} />
      </LineChart>
    </ResponsiveContainer>
  </div>
);

export default SeasonArcVisualization; 