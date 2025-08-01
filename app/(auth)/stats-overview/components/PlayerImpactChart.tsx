import React from "react";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const data = [
  { player: 'J. Smith', min: 32, eff: 24 },
  { player: 'A. Johnson', min: 28, eff: 19 },
  { player: 'M. Lee', min: 25, eff: 16 },
  { player: 'C. Brown', min: 20, eff: 12 },
  { player: 'D. White', min: 18, eff: 10 },
];

const PlayerImpactChart: React.FC = () => (
  <div style={{ height: 220, background: '#22304a', borderRadius: 8, padding: 8 }}>
    <div style={{ color: '#fff', fontWeight: 600, marginBottom: 8 }}>Player Impact Chart</div>
    <ResponsiveContainer width="100%" height="80%">
      <ScatterChart margin={{ top: 16, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#2a3b4d" />
        <XAxis dataKey="min" name="Minutes" stroke="#bfc9d1" fontSize={12} />
        <YAxis dataKey="eff" name="Efficiency" stroke="#bfc9d1" fontSize={12} />
        <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ background: '#23272f', border: 'none', color: '#fff' }} />
        <Scatter name="Players" data={data} fill="#1890ff" />
      </ScatterChart>
    </ResponsiveContainer>
  </div>
);

export default PlayerImpactChart; 