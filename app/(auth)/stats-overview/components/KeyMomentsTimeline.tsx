import React from "react";

const moments = [
  { time: 'Q1 03:12', desc: '3PT by J. Smith' },
  { time: 'Q2 07:45', desc: 'Timeout (Wildcats)' },
  { time: 'Q2 01:10', desc: 'Steal by A. Johnson' },
  { time: 'Q3 05:22', desc: 'And-1 by M. Lee' },
  { time: 'Q4 00:45', desc: 'Clutch FT by D. White' },
];

const KeyMomentsTimeline: React.FC = () => (
  <div style={{ height: 220, background: '#22304a', borderRadius: 8, padding: 8, color: '#fff' }}>
    <div style={{ color: '#fff', fontWeight: 600, marginBottom: 8 }}>Key Moments Timeline</div>
    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
      {moments.map((m, i) => (
        <li key={i} style={{ marginBottom: 10, display: 'flex', alignItems: 'center' }}>
          <span style={{ fontWeight: 700, color: '#faad14', minWidth: 80 }}>{m.time}</span>
          <span style={{ marginLeft: 12 }}>{m.desc}</span>
        </li>
      ))}
    </ul>
  </div>
);

export default KeyMomentsTimeline; 