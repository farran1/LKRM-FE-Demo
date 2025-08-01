import React from "react";
import { Table } from "antd";

interface Player {
  name: string;
  pts: number;
  reb: number;
  ast: number;
}

const columns = [
  { title: "Player", dataIndex: "name", key: "name", ellipsis: true },
  { title: "PTS", dataIndex: "pts", key: "pts", ellipsis: true },
  { title: "REB", dataIndex: "reb", key: "reb", ellipsis: true },
  { title: "AST", dataIndex: "ast", key: "ast", ellipsis: true },
];

const PlayerComparisonPanel: React.FC<{ players: Player[] }> = ({ players }) => (
  <div style={{ width: '100%', height: '100%', overflow: 'auto' }}>
    <Table
      columns={columns}
      dataSource={players.map((p, i) => ({ ...p, key: i }))}
      pagination={false}
      size="small"
      style={{ width: '100%' }}
      scroll={{ y: 'calc(100% - 40px)' }}
    />
  </div>
);

export default PlayerComparisonPanel; 