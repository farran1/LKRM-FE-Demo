import React from "react";

const data = [
  [1.12, 1.08, 1.05],
  [1.09, 1.15, 1.02],
  [1.04, 1.11, 1.07],
];

const getColor = (val: number) => {
  if (val > 1.12) return '#4be04b';
  if (val > 1.08) return '#faad14';
  return '#ff4d4f';
};

const LineupEfficiencyHeatmap: React.FC = () => (
  <div style={{ height: 220, background: '#22304a', borderRadius: 8, padding: 8, color: '#fff' }}>
    <div style={{ color: '#fff', fontWeight: 600, marginBottom: 8 }}>Lineup Efficiency Heatmap</div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center', height: '80%', justifyContent: 'center' }}>
      {data.map((row, i) => (
        <div key={i} style={{ display: 'flex', gap: 8 }}>
          {row.map((val, j) => (
            <div key={j} style={{ width: 48, height: 48, background: getColor(val), borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#23272f', fontSize: 16 }}>
              {val.toFixed(2)}
            </div>
          ))}
        </div>
      ))}
    </div>
  </div>
);

export default LineupEfficiencyHeatmap; 