import React from "react";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from "recharts";

const data = [
  { stat: 'PTS', value: 22 },
  { stat: 'REB', value: 9 },
  { stat: 'AST', value: 6 },
  { stat: 'STL', value: 2 },
  { stat: 'BLK', value: 1 },
  { stat: 'TO', value: 3 },
];

const PlayerRadarChart: React.FC = () => (
  <div style={{ height: 220, background: '#22304a', borderRadius: 8, padding: 8 }}>
    <div style={{ color: '#fff', fontWeight: 600, marginBottom: 8 }}>Player Radar Chart</div>
    <ResponsiveContainer width="100%" height="80%">
      <RadarChart data={data} outerRadius="80%">
        <PolarGrid stroke="#2a3b4d" />
        <PolarAngleAxis dataKey="stat" stroke="#bfc9d1" fontSize={12} />
        <PolarRadiusAxis angle={30} domain={[0, 25]} stroke="#bfc9d1" fontSize={10} />
        <Radar name="Player" dataKey="value" stroke="#1890ff" fill="#1890ff" fillOpacity={0.6} />
        <Tooltip contentStyle={{ background: '#23272f', border: 'none', color: '#fff' }} />
      </RadarChart>
    </ResponsiveContainer>
  </div>
);

export default PlayerRadarChart; 