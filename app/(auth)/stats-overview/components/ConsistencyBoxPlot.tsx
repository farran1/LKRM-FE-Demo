import React from "react";

const ConsistencyBoxPlot: React.FC = () => (
  <div style={{ height: 220, background: '#22304a', borderRadius: 8, padding: 8, color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
    <div style={{ color: '#fff', fontWeight: 600, marginBottom: 8 }}>Consistency Box Plot</div>
    <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Variance: 4.2</div>
    <div style={{ fontSize: 14, color: '#bfc9d1' }}>Min: 12 | Q1: 16 | Median: 19 | Q3: 22 | Max: 25</div>
  </div>
);

export default ConsistencyBoxPlot; 