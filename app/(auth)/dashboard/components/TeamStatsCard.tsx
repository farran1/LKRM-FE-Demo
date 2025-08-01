import React from "react";
import { Card, Statistic, Row, Col } from "antd";

export default function TeamStatsCard({ stats = {}, overflowClass = '' }) {
  return (
    <Card
      style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
      styles={{ body: { flex: 1, display: 'flex', flexDirection: 'column' } }}
      title={<span style={{ color: '#fff', fontWeight: 700 }}>Team Stats</span>}
      bordered={false}
    >
      <div className={overflowClass}>
        <Row gutter={16} style={{ color: '#fff' }}>
          <Col span={12}><Statistic title="PPG" value={stats.ppg} /></Col>
          <Col span={12}><Statistic title="PAPG" value={stats.papg} /></Col>
          <Col span={12}><Statistic title="Reb" value={stats.reb} /></Col>
          <Col span={12}><Statistic title="Ast" value={stats.ast} /></Col>
      </Row>
      </div>
    </Card>
  );
} 