import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const data = [
  { player: 'J. Smith', clutch: 12 },
  { player: 'A. Johnson', clutch: 9 },
  { player: 'M. Lee', clutch: 7 },
  { player: 'D. White', clutch: 6 },
];

const ClutchPerformancePanel: React.FC = () => (
  <div style={{ height: 220, background: '#22304a', borderRadius: 8, padding: 8 }}>
    <div style={{ color: '#fff', fontWeight: 600, marginBottom: 8 }}>Clutch Performance</div>
    <ResponsiveContainer width="100%" height="80%">
      <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#2a3b4d" />
        <XAxis dataKey="player" stroke="#bfc9d1" fontSize={12} />
        <YAxis stroke="#bfc9d1" fontSize={12} />
        <Tooltip contentStyle={{ background: '#23272f', border: 'none', color: '#fff' }} />
        <Bar dataKey="clutch" fill="#faad14" barSize={32} />
      </BarChart>
    </ResponsiveContainer>
  </div>
);

export default ClutchPerformancePanel; 