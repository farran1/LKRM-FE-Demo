import React from "react";

const recs = [
  "Increase pace in 2nd half",
  "Double-team top scorer in Q4",
  "Prioritize defensive rebounds",
  "Run more pick-and-roll sets",
  "Substitute for foul trouble early",
];

const StrategicRecommendations: React.FC = () => (
  <div style={{ height: 220, background: '#22304a', borderRadius: 8, padding: 8, color: '#fff' }}>
    <div style={{ color: '#fff', fontWeight: 600, marginBottom: 8 }}>Strategic Recommendations</div>
    <ul style={{ listStyle: 'disc', paddingLeft: 24, margin: 0 }}>
      {recs.map((r, i) => (
        <li key={i} style={{ marginBottom: 8 }}>{r}</li>
      ))}
    </ul>
  </div>
);

export default StrategicRecommendations; 