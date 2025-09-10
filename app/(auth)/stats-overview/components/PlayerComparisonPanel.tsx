import React from "react";
import { Table } from "antd";

interface Player {
  name: string;
  pts: number;
  reb: number;
  ast: number;
}

const columns = [
  { title: "Player", dataIndex: "name", key: "name" },
  { title: "PTS", dataIndex: "pts", key: "pts" },
  { title: "REB", dataIndex: "reb", key: "reb" },
  { title: "AST", dataIndex: "ast", key: "ast" },
];

const PlayerComparisonPanel: React.FC<{ players: Player[] }> = ({ players }) => (
  <div style={{ width: '100%', height: '100%', overflow: 'auto' }}>
    <Table
      columns={columns}
      dataSource={players.map((p, i) => ({ ...p, key: i }))}
      pagination={false}
      
      style={{ width: '100%' }}
      scroll={{ y: 'calc(100% - 40px)' }}
    />
  </div>
);

export default PlayerComparisonPanel; 