import React from "react";
import { Table } from "antd";

const data = [
  { key: 1, name: 'J. Smith', pts: 22, reb: 9, ast: 6 },
  { key: 2, name: 'A. Johnson', pts: 18, reb: 7, ast: 8 },
  { key: 3, name: 'M. Lee', pts: 15, reb: 11, ast: 4 },
];
const columns = [
  { title: 'Player', dataIndex: 'name', key: 'name' },
  { title: 'PTS', dataIndex: 'pts', key: 'pts' },
  { title: 'REB', dataIndex: 'reb', key: 'reb' },
  { title: 'AST', dataIndex: 'ast', key: 'ast' },
];

interface PlayerComparisonMatrixProps {
  filters?: { timeframe: string; events: string; players: string };
}

const PlayerComparisonMatrix: React.FC<PlayerComparisonMatrixProps> = ({ filters }) => {
  let filteredData = data;
  if (filters) {
    if (filters.players === 'Starters') {
      filteredData = data.slice(0, 2);
    } else if (filters.players === 'Bench') {
      filteredData = data.slice(-1);
    }
  }
  return (
    <div style={{ height: 220, background: '#22304a', borderRadius: 8, padding: 8, color: '#fff' }}>
      {filters && (
        <div style={{ color: '#bfc9d1', fontSize: 12, marginBottom: 4 }}>
          Filters: {filters.timeframe} | {filters.events} | {filters.players}
        </div>
      )}
      <div style={{ color: '#fff', fontWeight: 600, marginBottom: 8 }}>Player Comparison Matrix</div>
      <Table
        dataSource={filteredData}
        columns={columns}
        size="small"
        pagination={false}
        style={{ background: 'transparent', color: '#fff' }}
        bordered={false}
      />
    </div>
  );
}

export default PlayerComparisonMatrix; 