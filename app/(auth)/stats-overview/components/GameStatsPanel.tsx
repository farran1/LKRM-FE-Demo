import React from "react";
import { Table } from "antd";
import dayjs from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

interface Game {
  opponent: string;
  date: string;
  result: string;
}

const columns = [
  { title: "Date", dataIndex: "date", key: "date", ellipsis: true },
  { title: "Opponent", dataIndex: "opponent", key: "opponent", ellipsis: true },
  { title: "Result", dataIndex: "result", key: "result", ellipsis: true },
];

interface GameStatsPanelProps {
  games: Game[];
  filters?: { timeframe: string; events: string; players: string; customDateRange?: [dayjs.Dayjs, dayjs.Dayjs] };
}

const GameStatsPanel: React.FC<GameStatsPanelProps> = ({ games, filters }) => {
  let filteredGames = games;
  if (filters) {
    if (filters.timeframe === 'Custom' && filters.customDateRange && filters.customDateRange[0] && filters.customDateRange[1]) {
      filteredGames = games.filter(g => {
        const gameDate = dayjs(g.date);
        return gameDate.isSameOrAfter(filters.customDateRange[0], 'day') && gameDate.isSameOrBefore(filters.customDateRange[1], 'day');
      });
    } else if (filters.timeframe === 'Last 7 Days') {
      filteredGames = games.slice(-3);
    } else if (filters.timeframe === 'Custom') {
      filteredGames = games.slice(0, 5);
    } // 'Season' and 'All' show all
  }
  return (
    <div style={{ width: '100%', height: '100%', overflow: 'auto' }}>
      {filters && (
        <div style={{ color: '#bfc9d1', fontSize: 12, marginBottom: 4 }}>
          Filters: {filters.timeframe} | {filters.events} | {filters.players}
          {filters.timeframe === 'Custom' && filters.customDateRange && filters.customDateRange[0] && filters.customDateRange[1] && (
            <span> | {filters.customDateRange[0].format('YYYY-MM-DD')} to {filters.customDateRange[1].format('YYYY-MM-DD')}</span>
          )}
        </div>
      )}
      <Table
        columns={columns}
        dataSource={filteredGames.map((g, i) => ({ ...g, key: i }))}
        pagination={false}
        size="small"
        style={{ width: '100%' }}
        scroll={{ y: 'calc(100% - 40px)' }}
      />
    </div>
  );
}

export default GameStatsPanel; 